<?php

namespace App\Controllers\Email;

use App\Models\Email;
use App\Models\EmailAccount;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Database\PaginatedResult;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class EmailListController extends Controller
{
    public function get(): JsonResponse
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        /** @var string[] $accessibleAccountIds */
        $accessibleAccountIds = CacheHelper::remember('email_accounts', $userId, 300, fn(): array => $this->getAccessibleAccountIds($userId, $officeId));

        if ($accessibleAccountIds === []) {
            return JsonResponse::paginated(new PaginatedResult([], 1, 50, 0));
        }

        $query = Email::query();
        $query->qb()->whereIn('email_account_id', $accessibleAccountIds);

        // Filter by specific account
        $accountId = $this->request->query['account_id'] ?? null;
        if ($accountId !== null && $accountId !== '') {
            if (!in_array($accountId, $accessibleAccountIds, true)) {
                return JsonResponse::forbidden('Access denied to this email account');
            }

            $query = $query->where('email_account_id', '=', $accountId);
        }

        // Filter by direction
        $direction = $this->request->query['direction'] ?? null;
        if ($direction !== null && $direction !== '') {
            $query = $query->where('direction', '=', $direction);
        }

        // Filter by status
        $status = $this->request->query['status'] ?? null;
        if ($status !== null && $status !== '') {
            $query = $query->where('status', '=', $status);
        }

        // Filter by folder
        $folder = $this->request->query['folder'] ?? null;
        if ($folder !== null && $folder !== '') {
            if ($folder === 'inbox') {
                // Treat null folder as inbox (for pre-migration emails)
                $query->qb()->whereGroup(function ($qb): void {
                    $qb->where('folder', '=', 'inbox')
                        ->orWhereNull('folder');
                });
            } else {
                $query = $query->where('folder', '=', $folder);
            }
        }

        // Filter by contact_id
        $contactId = $this->request->query['contact_id'] ?? null;
        if ($contactId !== null && $contactId !== '') {
            $query = $query->where('contact_id', '=', $contactId);
        }

        // Search by subject or from_address
        $q = $this->request->query['q'] ?? null;
        if ($q !== null && $q !== '') {
            $query->qb()->whereGroup(function ($qb) use ($q): void {
                $qb->where('subject', 'LIKE', sprintf('%%%s%%', $q))
                    ->orWhere('from_address', 'LIKE', sprintf('%%%s%%', $q))
                    ->orWhere('to_addresses', 'LIKE', sprintf('%%%s%%', $q));
            });
        }

        // Exclude archived by default
        $includeArchived = $this->request->query['include_archived'] ?? null;
        if ($includeArchived !== 'true' && $includeArchived !== '1') {
            $query->qb()->where('status', '!=', 'archived');
        }

        $query = $query->orderBy('received_at', 'DESC');

        [$query, $page, $perPage] = ControllerListHelpers::applyListParams(
            $query,
            $this->request,
            50,
        );

        $result = $query->paginate($page, $perPage, 50, true);

        return JsonResponse::paginated($result);
    }

    /**
     * @return string[]
     */
    private function getAccessibleAccountIds(string $userId, ?string $officeId): array
    {
        $query = EmailAccount::query();
        $query->qb()->whereGroup(function ($qb) use ($userId, $officeId): void {
            $qb->whereGroup(function ($qb) use ($userId): void {
                $qb->where('user_id', '=', $userId)
                    ->where('scope', '=', 'personal');
            })->orWhereGroup(function ($qb) use ($officeId): void {
                if ($officeId !== null) {
                    $qb->where('office_id', '=', $officeId)
                        ->where('scope', '=', 'office');
                }
            });
        });
        $query = $query->where('active', '=', true);

        $accounts = $query->get();
        $ids = [];
        foreach ($accounts as $account) {
            $ids[] = $account->id;
        }

        return $ids;
    }
}
