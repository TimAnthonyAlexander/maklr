<?php

namespace App\Controllers\Office;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Models\BaseModel;
use BaseApi\Support\ClientIp;
use App\Models\Office;
use App\Services\AuditLogService;

class OfficeUpdateController extends Controller
{
    public string $id = '';

    public ?string $name = null;

    public ?string $address = null;

    public ?string $city = null;

    public ?string $zip = null;

    public ?string $country = null;

    public ?string $phone = null;

    public ?string $email = null;

    private const array PATCHABLE_FIELDS = ['name', 'address', 'city', 'zip', 'country', 'phone', 'email'];

    public function patch(): JsonResponse
    {
        $office = Office::find($this->id);

        if (!$office instanceof BaseModel || !$office->active) {
            return JsonResponse::notFound('Office not found');
        }

        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $office->{$field};
        }

        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $office->{$field} = $this->{$field};
            }
        }

        $office->save();

        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $office->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'office',
            $office->id,
            $changes,
            ClientIp::from($this->request, true),
            $office->id,
        );

        return JsonResponse::ok($office);
    }
}
