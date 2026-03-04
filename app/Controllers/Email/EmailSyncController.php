<?php

namespace App\Controllers\Email;

use Throwable;
use App\Models\EmailAccount;
use App\Services\ImapService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EmailSyncController extends Controller
{
    public string $id = '';

    public function __construct(
        private readonly ImapService $imapService,
    ) {}

    public function post(): JsonResponse
    {
        $account = $this->findAccessibleAccount($this->id);

        if (!$account instanceof EmailAccount) {
            return JsonResponse::notFound('Email account not found');
        }

        try {
            $synced = $this->imapService->syncAccount($account);

            $account->last_sync_at = date('Y-m-d H:i:s');
            $account->last_error = null;
            $account->save();

            return JsonResponse::ok([
                'success' => true,
                'synced' => $synced,
            ]);
        } catch (Throwable $throwable) {
            $account->last_error = $throwable->getMessage();
            $account->save();

            return JsonResponse::ok([
                'success' => false,
                'synced' => 0,
                'error' => $throwable->getMessage(),
            ]);
        }
    }

    private function findAccessibleAccount(string $id): ?EmailAccount
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        $account = EmailAccount::where('id', '=', $id)
            ->where('user_id', '=', $userId)
            ->where('scope', '=', 'personal')
            ->where('active', '=', true)
            ->first();

        if ($account instanceof EmailAccount) {
            return $account;
        }

        if ($officeId !== null) {
            $account = EmailAccount::where('id', '=', $id)
                ->where('office_id', '=', $officeId)
                ->where('scope', '=', 'office')
                ->where('active', '=', true)
                ->first();

            if ($account instanceof EmailAccount) {
                return $account;
            }
        }

        return null;
    }
}
