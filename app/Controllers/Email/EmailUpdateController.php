<?php

namespace App\Controllers\Email;

use App\Models\Email;
use App\Models\EmailAccount;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EmailUpdateController extends Controller
{
    public string $id = '';

    public ?string $status = null;

    public ?bool $read = null;

    public ?string $contact_id = null;

    public ?string $estate_id = null;

    private const array PATCHABLE_FIELDS = ['status', 'read', 'contact_id', 'estate_id'];

    public function patch(): JsonResponse
    {
        $email = Email::find($this->id);

        if (!$email instanceof Email) {
            return JsonResponse::notFound('Email not found');
        }

        if (!$this->isAccountAccessible($email->email_account_id)) {
            return JsonResponse::notFound('Email not found');
        }

        $body = $this->request->body ?? [];
        $patched = false;

        foreach (self::PATCHABLE_FIELDS as $field) {
            if (array_key_exists($field, $body)) {
                $email->{$field} = $body[$field];
                $patched = true;
            }
        }

        if ($patched) {
            $email->save();
        }

        return JsonResponse::ok($email->toArray());
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
