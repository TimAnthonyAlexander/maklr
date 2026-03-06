<?php

namespace App\Controllers\Portal;

use App\Models\Portal;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\EncryptionService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

final class PortalCreateController extends Controller
{
    public string $name = '';

    public string $portal_type = 'ftp';

    public ?string $ftp_host = null;

    public ?int $ftp_port = null;

    public ?string $ftp_username = null;

    public ?string $ftp_password = null;

    public ?string $ftp_path = null;

    public bool $ftp_passive = true;

    public bool $ftp_ssl = false;

    public ?string $api_url = null;

    public ?string $api_key = null;

    public ?string $provider_id = null;

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'name' => 'required|string|max:100',
                'portal_type' => 'required|string|in:ftp,api',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $userId = $this->request->user['id'] ?? '';
        $officeId = $this->request->user['office_id'] ?? null;

        $portal = new Portal();
        $portal->name = $this->name;
        $portal->portal_type = $this->portal_type;
        $portal->ftp_host = $this->ftp_host;
        $portal->ftp_port = $this->ftp_port;
        $portal->ftp_username = $this->ftp_username;
        $portal->ftp_path = $this->ftp_path;
        $portal->ftp_passive = $this->ftp_passive;
        $portal->ftp_ssl = $this->ftp_ssl;
        $portal->api_url = $this->api_url;
        $portal->provider_id = $this->provider_id;
        $portal->office_id = $officeId;

        /** @var EncryptionService $encryption */
        $encryption = $this->make(EncryptionService::class);

        if ($this->ftp_password !== null && $this->ftp_password !== '') {
            $portal->ftp_password_encrypted = $encryption->encrypt($this->ftp_password);
        }

        if ($this->api_key !== null && $this->api_key !== '') {
            $portal->api_key_encrypted = $encryption->encrypt($this->api_key);
        }

        $portal->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'created',
            'portal',
            $portal->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'portal_created',
            subject: 'Portal created: ' . $portal->name,
            userId: $userId,
            officeId: $officeId,
        );

        return JsonResponse::created($portal->toArray());
    }
}
