<?php

namespace App\Controllers\Website;

use App\Models\Website;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class WebsiteCreateController extends Controller
{
    public string $name = '';

    public string $slug = '';

    public ?string $description = null;

    private const int MAX_SITES_PER_OFFICE = 5;

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'name' => 'required|string|max:255',
                'slug' => 'required|string|max:100',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;

        // Validate slug format
        if (!preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', $this->slug)) {
            return JsonResponse::validationError([
                'slug' => ['Slug must contain only lowercase letters, numbers, and hyphens'],
            ]);
        }

        // Check slug uniqueness
        if (Website::where('slug', '=', $this->slug)->exists()) {
            return JsonResponse::validationError([
                'slug' => ['This slug is already taken'],
            ]);
        }

        // Check office site limit
        $siteCount = Website::where('office_id', '=', $officeId)->count();
        if ($siteCount >= self::MAX_SITES_PER_OFFICE) {
            return JsonResponse::badRequest('Maximum of ' . self::MAX_SITES_PER_OFFICE . ' websites per office reached');
        }

        $website = new Website();
        $website->name = $this->name;
        $website->slug = $this->slug;
        $website->description = $this->description;
        $website->published = false;
        $website->user_id = $this->request->user['id'];
        $website->office_id = $officeId;
        $website->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'website',
            $website->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'website_created',
            subject: 'Website created: ' . $website->name,
            userId: $this->request->user['id'],
            officeId: $officeId,
        );

        return JsonResponse::created($website->toArray());
    }
}
