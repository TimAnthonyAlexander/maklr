<?php

namespace App\Controllers\Office;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Models\BaseModel;
use BaseApi\Support\ClientIp;
use App\Models\Office;
use App\Services\AuditLogService;

class OfficeDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $office = Office::find($this->id);

        if (!$office instanceof BaseModel || !$office->active) {
            return JsonResponse::notFound('Office not found');
        }

        $office->active = false;
        $office->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'office',
            $office->id,
            ['active' => ['old' => true, 'new' => false]],
            ClientIp::from($this->request, true),
            $office->id,
        );

        return JsonResponse::ok(['message' => 'Office deactivated']);
    }
}
