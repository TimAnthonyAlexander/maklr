<?php

namespace App\Controllers\WebsitePage;

use App\Models\Website;
use App\Models\WebsitePage;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class WebsitePageShowController extends Controller
{
    public string $websiteId = '';

    public string $id = '';

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

        $page = WebsitePage::where('id', '=', $this->id)
            ->where('website_id', '=', $this->websiteId)
            ->first();

        if (!$page instanceof WebsitePage) {
            return JsonResponse::notFound('Page not found');
        }

        return JsonResponse::ok($page->toArray());
    }
}
