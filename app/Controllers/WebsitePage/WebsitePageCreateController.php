<?php

namespace App\Controllers\WebsitePage;

use App\Models\Website;
use App\Models\WebsitePage;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class WebsitePageCreateController extends Controller
{
    public string $websiteId = '';

    public string $title = '';

    public string $slug = '';

    public ?string $html_content = null;

    public ?int $sort_order = null;

    private const int MAX_PAGES_PER_SITE = 20;

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'title' => 'required|string|max:255',
                'slug' => 'required|string|max:100',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;

        // Verify website belongs to office
        $website = Website::where('id', '=', $this->websiteId)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$website instanceof Website) {
            return JsonResponse::notFound('Website not found');
        }

        // Validate slug format
        if (!preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', $this->slug)) {
            return JsonResponse::validationError([
                'slug' => ['Slug must contain only lowercase letters, numbers, and hyphens'],
            ]);
        }

        // Check slug uniqueness within website
        if (WebsitePage::where('website_id', '=', $this->websiteId)
            ->where('slug', '=', $this->slug)
            ->exists()
        ) {
            return JsonResponse::validationError([
                'slug' => ['This slug is already used in this website'],
            ]);
        }

        // Check page limit
        $pageCount = WebsitePage::where('website_id', '=', $this->websiteId)->count();
        if ($pageCount >= self::MAX_PAGES_PER_SITE) {
            return JsonResponse::badRequest('Maximum of ' . self::MAX_PAGES_PER_SITE . ' pages per website reached');
        }

        // Determine sort order
        $sortOrder = $this->sort_order ?? $pageCount;

        $websitePage = new WebsitePage();
        $websitePage->title = $this->title;
        $websitePage->slug = $this->slug;
        $websitePage->html_content = $this->html_content;
        $websitePage->sort_order = $sortOrder;
        $websitePage->published = true;
        $websitePage->website_id = $this->websiteId;
        $websitePage->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'website_page',
            $websitePage->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::created($websitePage->toArray());
    }
}
