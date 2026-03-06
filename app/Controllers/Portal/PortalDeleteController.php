<?php

namespace App\Controllers\Portal;

use App\Models\Portal;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

final class PortalDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'] ?? '';

        $portal = Portal::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$portal instanceof Portal) {
            return JsonResponse::notFound('Portal not found');
        }

        $portalName = $portal->name;
        $portal->delete();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'deleted',
            'portal',
            $this->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'portal_deleted',
            subject: 'Portal deleted: ' . $portalName,
            userId: $userId,
            officeId: $officeId,
        );

        return JsonResponse::ok(['message' => 'Portal deleted']);
    }
}
