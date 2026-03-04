<?php

namespace App\Controllers\Email;

use App\Models\Email;
use App\Models\EmailAccount;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EmailShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $email = Email::with(['contact', 'estate'])
            ->where('id', '=', $this->id)
            ->first();

        if (!$email instanceof Email) {
            return JsonResponse::notFound('Email not found');
        }

        if (!$this->isAccountAccessible($email->email_account_id)) {
            return JsonResponse::notFound('Email not found');
        }

        return JsonResponse::ok($email->toArray(true));
    }

    private function isAccountAccessible(string $accountId): bool
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        $account = EmailAccount::where('id', '=', $accountId)
            ->where('user_id', '=', $userId)
            ->where('scope', '=', 'personal')
            ->first();

        if ($account instanceof EmailAccount) {
            return true;
        }

        if ($officeId !== null) {
            $account = EmailAccount::where('id', '=', $accountId)
                ->where('office_id', '=', $officeId)
                ->where('scope', '=', 'office')
                ->first();

            if ($account instanceof EmailAccount) {
                return true;
            }
        }

        return false;
    }
}
