<?php

namespace App\Controllers\EmailAccount;

use App\Models\EmailAccount;
use App\Services\ImapService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use Throwable;

class EmailAccountTestController extends Controller
{
    public string $id = '';

    public function post(): JsonResponse
    {
        $account = $this->findAccessibleAccount($this->id);

        if (!$account instanceof EmailAccount) {
            return JsonResponse::notFound('Email account not found');
        }

        /** @var ImapService $imapService */
        $imapService = $this->make(ImapService::class);

        try {
            $imapService->testConnection($account);
        } catch (Throwable $throwable) {
            // Update last_error on the account
            $account->last_error = $throwable->getMessage();
            $account->save();

            return JsonResponse::ok([
                'success' => false,
                'error' => $throwable->getMessage(),
            ]);
        }

        // Clear any previous error
        $account->last_error = null;
        $account->save();

        return JsonResponse::ok([
            'success' => true,
        ]);
    }

    private function findAccessibleAccount(string $id): ?EmailAccount
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        // Personal account
        $account = EmailAccount::where('id', '=', $id)
            ->where('user_id', '=', $userId)
            ->where('scope', '=', 'personal')
            ->first();

        if ($account instanceof EmailAccount) {
            return $account;
        }

        // Office account
        if ($officeId !== null) {
            $account = EmailAccount::where('id', '=', $id)
                ->where('office_id', '=', $officeId)
                ->where('scope', '=', 'office')
                ->first();

            if ($account instanceof EmailAccount) {
                return $account;
            }
        }

        return null;
    }
}
