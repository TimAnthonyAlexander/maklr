<?php

namespace App\Controllers\WebsitePage;

use App\Models\Website;
use App\Models\WebsitePage;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

class WebsitePageDeleteController extends Controller
{
    public string $websiteId = '';

    public string $id = '';

    public function delete(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        // Verify website belongs to office
        $website = Website::where('id', '=', $this->websiteId)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$website instanceof Website) {
            return JsonResponse::notFound('Website not found');
        }

        $page = WebsitePage::where('id', '=', $this->id)
            ->where('website_id', '=', $this->websiteId)
            ->first();

        if (!$page instanceof WebsitePage) {
            return JsonResponse::notFound('Page not found');
        }

        $pageId = $page->id;

        $page->delete();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'website_page',
            $pageId,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::ok(['message' => 'Page deleted']);
    }
}
