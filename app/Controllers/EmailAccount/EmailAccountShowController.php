<?php

namespace App\Controllers\EmailAccount;

use App\Models\EmailAccount;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EmailAccountShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $account = $this->findAccessibleAccount($this->id);

        if (!$account instanceof EmailAccount) {
            return JsonResponse::notFound('Email account not found');
        }

        return JsonResponse::ok($account->toArray());
    }

    private function findAccessibleAccount(string $id): ?EmailAccount
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        // Try personal account first
        $account = EmailAccount::where('id', '=', $id)
            ->where('user_id', '=', $userId)
            ->where('scope', '=', 'personal')
            ->first();

        if ($account instanceof EmailAccount) {
            return $account;
        }

        // Try office account
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
