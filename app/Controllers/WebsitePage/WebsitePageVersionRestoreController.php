<?php

namespace App\Controllers\WebsitePage;

use App\Models\Website;
use App\Models\WebsitePage;
use App\Models\WebsitePageVersion;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

class WebsitePageVersionRestoreController extends Controller
{
    public string $websiteId = '';

    public string $pageId = '';

    public string $versionId = '';

    public function post(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];

        // Verify website belongs to office
        $website = Website::where('id', '=', $this->websiteId)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$website instanceof Website) {
            return JsonResponse::notFound('Website not found');
        }

        // Verify page belongs to website
        $page = WebsitePage::where('id', '=', $this->pageId)
            ->where('website_id', '=', $this->websiteId)
            ->first();

        if (!$page instanceof WebsitePage) {
            return JsonResponse::notFound('Page not found');
        }

        // Find the version to restore
        $version = WebsitePageVersion::where('id', '=', $this->versionId)
            ->where('page_id', '=', $this->pageId)
            ->first();

        if (!$version instanceof WebsitePageVersion) {
            return JsonResponse::notFound('Version not found');
        }

        // Snapshot current content before restoring
        $lastVersion = WebsitePageVersion::where('page_id', '=', $this->pageId)
            ->orderBy('version_number', 'DESC')
            ->first();

        $nextVersionNumber = $lastVersion instanceof WebsitePageVersion
            ? $lastVersion->version_number + 1
            : 1;

        $snapshot = new WebsitePageVersion();
        $snapshot->page_id = $this->pageId;
        $snapshot->html_content = $page->html_content;
        $snapshot->version_number = $nextVersionNumber;
        $snapshot->change_summary = 'Snapshot before restoring version ' . $version->version_number;
        $snapshot->created_by_user_id = $userId;
        $snapshot->save();

        // Restore the version's HTML to the page
        $page->html_content = $version->html_content;
        $page->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'restored',
            'website_page_version',
            $version->id,
            ['restored_version' => ['old' => '', 'new' => (string) $version->version_number]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::ok([
            'message' => 'Version ' . $version->version_number . ' restored',
            'page' => $page->toArray(),
        ]);
    }
}
