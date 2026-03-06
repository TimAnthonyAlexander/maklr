<?php

namespace App\Controllers\WebsitePage;

use App\Models\Website;
use App\Models\WebsitePage;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class WebsitePageUpdateController extends Controller
{
    public string $websiteId = '';

    public string $id = '';

    public ?string $title = null;

    public ?string $slug = null;

    public ?string $html_content = null;

    public ?int $sort_order = null;

    public ?bool $published = null;

    private const array PATCHABLE_FIELDS = ['title', 'slug', 'html_content', 'sort_order', 'published'];

    public function patch(): JsonResponse
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

        try {
            if ($this->title !== null) {
                $this->validate(['title' => 'string|max:255']);
            }

            if ($this->slug !== null) {
                $this->validate(['slug' => 'string|max:100']);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        // Validate slug format if provided
        if ($this->slug !== null && !preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', $this->slug)) {
            return JsonResponse::validationError([
                'slug' => ['Slug must contain only lowercase letters, numbers, and hyphens'],
            ]);
        }

        // Check slug uniqueness if changed
        if ($this->slug !== null && $this->slug !== $page->slug && WebsitePage::where('website_id', '=', $this->websiteId)
            ->where('slug', '=', $this->slug)
            ->exists()) {
            return JsonResponse::validationError([
                'slug' => ['This slug is already used in this website'],
            ]);
        }

        // Snapshot old values for audit
        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $page->{$field};
        }

        // Apply non-null incoming values
        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $page->{$field} = $this->{$field};
            }
        }

        $page->save();

        // Compute diff for audit
        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $page->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'website_page',
            $page->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::ok($page->toArray());
    }
}
