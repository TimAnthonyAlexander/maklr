<?php

namespace App\Controllers\Estate;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;
use App\Models\Estate;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;

class EstateDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate || $estate->status === 'archived') {
            return JsonResponse::notFound('Estate not found');
        }

        $oldStatus = $estate->status;
        $estate->status = 'archived';
        $estate->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'estate',
            $estate->id,
            ['status' => ['old' => $oldStatus, 'new' => 'archived']],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'estate_deleted',
            subject: 'Estate deleted: ' . $estate->title,
            userId: $this->request->user['id'],
            officeId: $officeId,
            estateId: $estate->id,
        );

        CacheHelper::forget('dashboard', $officeId ?? 'none');

        return JsonResponse::ok(['message' => 'Estate archived']);
    }
}
