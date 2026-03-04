<?php

namespace App\Controllers\Office;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;
use App\Models\Office;
use App\Services\AuditLogService;

class OfficeCreateController extends Controller
{
    public string $name = '';

    public ?string $address = null;

    public ?string $city = null;

    public ?string $zip = null;

    public ?string $country = null;

    public ?string $phone = null;

    public ?string $email = null;

    public function post(): JsonResponse
    {
        $this->validate([
            'name' => 'required|string',
        ]);

        $office = new Office();
        $office->name = $this->name;
        $office->address = $this->address;
        $office->city = $this->city;
        $office->zip = $this->zip;
        $office->country = $this->country;
        $office->phone = $this->phone;
        $office->email = $this->email;
        $office->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'office',
            $office->id,
            [],
            ClientIp::from($this->request, true),
            $office->id,
        );

        return JsonResponse::created($office);
    }
}
