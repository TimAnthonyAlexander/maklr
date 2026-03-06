<?php

namespace App\Controllers\Website;

use App\Models\Website;
use App\Models\WebsiteChatMessage;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class WebsiteChatListController extends Controller
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

        // Filter by page_id if provided
        $query = WebsiteChatMessage::where('website_id', '=', $this->websiteId);

        $pageId = $this->request->query['page_id'] ?? null;
        if ($pageId !== null && $pageId !== '') {
            $query = $query->where('page_id', '=', $pageId);
        }

        $messages = $query->orderBy('created_at', 'ASC')->get();
        $items = array_map(fn (WebsiteChatMessage $msg) => $msg->toArray(), $messages);

        return JsonResponse::ok(['items' => $items]);
    }
}
