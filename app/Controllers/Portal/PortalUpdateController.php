<?php

namespace App\Controllers\Portal;

use App\Models\Portal;
use App\Services\AuditLogService;
use App\Services\EncryptionService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

final class PortalUpdateController extends Controller
{
    public string $id = '';

    public ?string $name = null;

    public ?string $portal_type = null;

    public ?string $ftp_host = null;

    public ?int $ftp_port = null;

    public ?string $ftp_username = null;

    public ?string $ftp_password = null;

    public ?string $ftp_path = null;

    public ?bool $ftp_passive = null;

    public ?bool $ftp_ssl = null;

    public ?string $api_url = null;

    public ?string $api_key = null;

    public ?string $provider_id = null;

    public ?bool $active = null;

    private const array PATCHABLE_FIELDS = [
        'name', 'portal_type', 'ftp_host', 'ftp_port', 'ftp_username',
        'ftp_path', 'ftp_passive', 'ftp_ssl', 'api_url', 'provider_id', 'active',
    ];

    public function patch(): JsonResponse
    {
        try {
            $this->validate([
                'name' => 'string|max:100',
                'portal_type' => 'string|in:ftp,api',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;

        $portal = Portal::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$portal instanceof Portal) {
            return JsonResponse::notFound('Portal not found');
        }

        $oldData = $portal->toArray();

        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $portal->{$field} = $this->{$field};
            }
        }

        /** @var EncryptionService $encryption */
        $encryption = $this->make(EncryptionService::class);

        $changes = AuditLogService::computeChanges($oldData, $portal->toArray(), self::PATCHABLE_FIELDS);

        if ($this->ftp_password !== null && $this->ftp_password !== '') {
            $portal->ftp_password_encrypted = $encryption->encrypt($this->ftp_password);
            $changes['ftp_password'] = ['old' => '***', 'new' => '***'];
        }

        if ($this->api_key !== null && $this->api_key !== '') {
            $portal->api_key_encrypted = $encryption->encrypt($this->api_key);
            $changes['api_key'] = ['old' => '***', 'new' => '***'];
        }

        $portal->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'portal',
            $portal->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::ok($portal->toArray());
    }
}
