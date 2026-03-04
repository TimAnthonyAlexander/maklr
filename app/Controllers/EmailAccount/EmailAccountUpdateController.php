<?php

namespace App\Controllers\EmailAccount;

use App\Models\EmailAccount;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use App\Services\EncryptionService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class EmailAccountUpdateController extends Controller
{
    public string $id = '';

    public ?string $name = null;

    public ?string $email_address = null;

    public ?string $imap_host = null;

    public ?int $imap_port = null;

    public ?string $imap_encryption = null;

    public ?string $smtp_host = null;

    public ?int $smtp_port = null;

    public ?string $smtp_encryption = null;

    public ?string $username = null;

    public ?string $password = null;

    public ?bool $active = null;

    private const array ENCRYPTION_TYPES = ['ssl', 'tls', 'none'];

    private const array PATCHABLE_FIELDS = [
        'name', 'email_address',
        'imap_host', 'imap_port', 'imap_encryption',
        'smtp_host', 'smtp_port', 'smtp_encryption',
        'username', 'active',
    ];

    public function patch(): JsonResponse
    {
        $account = $this->findWritableAccount($this->id);

        if (!$account instanceof EmailAccount) {
            return JsonResponse::notFound('Email account not found');
        }

        try {
            $rules = [];

            if ($this->name !== null) {
                $rules['name'] = 'string|max:100';
            }

            if ($this->email_address !== null) {
                $rules['email_address'] = 'string|email';
            }

            if ($this->imap_encryption !== null) {
                $rules['imap_encryption'] = 'string|in:' . implode(',', self::ENCRYPTION_TYPES);
            }

            if ($this->smtp_encryption !== null) {
                $rules['smtp_encryption'] = 'string|in:' . implode(',', self::ENCRYPTION_TYPES);
            }

            if ($rules !== []) {
                $this->validate($rules);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        // Snapshot for audit
        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $account->{$field};
        }

        // Apply non-null fields
        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $account->{$field} = $this->{$field};
            }
        }

        // Handle password separately (needs encryption)
        if ($this->password !== null) {
            /** @var EncryptionService $encryption */
            $encryption = $this->make(EncryptionService::class);
            $account->password_encrypted = $encryption->encrypt($this->password);
        }

        $account->save();

        // Audit log
        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $account->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        if ($this->password !== null) {
            $changes['password'] = ['old' => '***', 'new' => '***'];
        }

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'email_account',
            $account->id,
            $changes,
            ClientIp::from($this->request, true),
            $this->request->user['office_id'] ?? null,
        );

        CacheHelper::forget('email_accounts', $this->request->user['id']);

        return JsonResponse::ok($account->toArray());
    }

    private function findWritableAccount(string $id): ?EmailAccount
    {
        $userId = $this->request->user['id'];
        $userRole = $this->request->user['role'] ?? '';
        $officeId = $this->request->user['office_id'] ?? null;

        // Personal: only owner
        $account = EmailAccount::where('id', '=', $id)
            ->where('user_id', '=', $userId)
            ->where('scope', '=', 'personal')
            ->first();

        if ($account instanceof EmailAccount) {
            return $account;
        }

        // Office: only admin/manager in same office
        if ($officeId !== null && in_array($userRole, ['admin', 'manager'])) {
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
