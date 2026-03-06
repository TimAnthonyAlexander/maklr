<?php

namespace App\Controllers\WebsitePage;

use App\Models\Website;
use App\Models\WebsitePage;
use App\Models\WebsitePageVersion;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class WebsitePageVersionListController extends Controller
{
    public string $websiteId = '';

    public string $pageId = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

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

        $versions = WebsitePageVersion::where('page_id', '=', $this->pageId)
            ->orderBy('version_number', 'DESC')
            ->get();

        $items = array_map(fn (WebsitePageVersion $v) => $v->toArray(), $versions);

        return JsonResponse::ok(['items' => $items]);
    }
}
