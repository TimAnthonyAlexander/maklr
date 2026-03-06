<?php

namespace App\Controllers\WebsitePage;

use App\Models\Website;
use App\Models\WebsitePage;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class WebsitePageListController extends Controller
{
    public string $websiteId = '';

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

        $pages = WebsitePage::where('website_id', '=', $this->websiteId)
            ->orderBy('sort_order', 'ASC')
            ->get();

        $items = array_map(fn (WebsitePage $page) => $page->toArray(), $pages);

        return JsonResponse::ok(['items' => $items]);
    }
}
