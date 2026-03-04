<?php

namespace App\Controllers\EmailAccount;

use App\Models\EmailAccount;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use App\Services\EncryptionService;
use App\Services\ImapService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;
use Throwable;

class EmailAccountCreateController extends Controller
{
    public string $name = '';

    public string $email_address = '';

    public string $imap_host = '';

    public int $imap_port = 993;

    public string $imap_encryption = 'ssl';

    public string $smtp_host = '';

    public int $smtp_port = 465;

    public string $smtp_encryption = 'ssl';

    public string $username = '';

    public string $password = '';

    public string $scope = 'personal';

    private const array ENCRYPTION_TYPES = ['ssl', 'tls', 'none'];

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'name' => 'required|string|max:100',
                'email_address' => 'required|string|email',
                'imap_host' => 'required|string|max:255',
                'imap_port' => 'required|integer',
                'imap_encryption' => 'required|string|in:' . implode(',', self::ENCRYPTION_TYPES),
                'smtp_host' => 'required|string|max:255',
                'smtp_port' => 'required|integer',
                'smtp_encryption' => 'required|string|in:' . implode(',', self::ENCRYPTION_TYPES),
                'username' => 'required|string|max:255',
                'password' => 'required|string',
                'scope' => 'string|in:personal,office',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $userId = $this->request->user['id'];
        $userRole = $this->request->user['role'] ?? '';
        $officeId = $this->request->user['office_id'] ?? null;

        // Only admin/manager can create office-scoped accounts
        if ($this->scope === 'office' && !in_array($userRole, ['admin', 'manager'])) {
            return JsonResponse::forbidden('Only admin or manager can create office-scoped email accounts');
        }

        /** @var EncryptionService $encryption */
        $encryption = $this->make(EncryptionService::class);

        $emailAccount = new EmailAccount();
        $emailAccount->user_id = $userId;
        $emailAccount->name = $this->name;
        $emailAccount->email_address = $this->email_address;
        $emailAccount->imap_host = $this->imap_host;
        $emailAccount->imap_port = $this->imap_port;
        $emailAccount->imap_encryption = $this->imap_encryption;
        $emailAccount->smtp_host = $this->smtp_host;
        $emailAccount->smtp_port = $this->smtp_port;
        $emailAccount->smtp_encryption = $this->smtp_encryption;
        $emailAccount->username = $this->username;
        $emailAccount->password_encrypted = $encryption->encrypt($this->password);
        $emailAccount->scope = $this->scope;

        if ($this->scope === 'office') {
            $emailAccount->office_id = $officeId;
        }

        // Test IMAP connection before saving
        /** @var ImapService $imapService */
        $imapService = $this->make(ImapService::class);

        try {
            $imapService->testConnection($emailAccount);
        } catch (Throwable $throwable) {
            return JsonResponse::badRequest('IMAP connection test failed: ' . $throwable->getMessage());
        }

        $emailAccount->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'created',
            'email_account',
            $emailAccount->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'email_account_created',
            subject: 'Email account connected: ' . $emailAccount->email_address,
            userId: $userId,
            officeId: $emailAccount->office_id,
        );

        CacheHelper::forget('email_accounts', $userId);

        return JsonResponse::created($emailAccount->toArray());
    }
}
