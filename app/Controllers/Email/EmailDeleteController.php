<?php

namespace App\Controllers\Email;

use App\Models\Email;
use App\Models\EmailAccount;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EmailDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $email = Email::find($this->id);

        if (!$email instanceof Email) {
            return JsonResponse::notFound('Email not found');
        }

        if (!$this->isAccountAccessible($email->email_account_id)) {
            return JsonResponse::notFound('Email not found');
        }

        $email->status = 'archived';
        $email->save();

        return JsonResponse::ok(['message' => 'Email archived']);
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
