<?php

namespace App\Controllers\EmailAccount;

use App\Models\EmailAccount;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class EmailAccountListController extends Controller
{
    public function get(): JsonResponse
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        $query = EmailAccount::query();

        // Personal accounts owned by user OR office accounts in user's office
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

        // Filter by active status
        $active = $this->request->query['active'] ?? null;
        if ($active !== null && $active !== '') {
            $query = $query->where('active', '=', $active === 'true' || $active === '1');
        }

        [$query, $page, $perPage] = ControllerListHelpers::applyListParams(
            $query,
            $this->request,
            50,
        );

        $result = $query->paginate($page, $perPage, 50, true);

        return JsonResponse::paginated($result);
    }
}
