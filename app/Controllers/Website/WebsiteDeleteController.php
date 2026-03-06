<?php

namespace App\Controllers\Website;

use App\Models\Website;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

class WebsiteDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $website = Website::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$website instanceof Website) {
            return JsonResponse::notFound('Website not found');
        }

        $websiteName = $website->name;
        $websiteId = $website->id;

        // Hard delete — cascading FKs will remove pages, versions, and chat messages
        $website->delete();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'website',
            $websiteId,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'website_deleted',
            subject: 'Website deleted: ' . $websiteName,
            userId: $this->request->user['id'],
            officeId: $officeId,
        );

        return JsonResponse::ok(['message' => 'Website deleted']);
    }
}
