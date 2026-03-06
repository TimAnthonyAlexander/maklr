<?php

namespace App\Controllers\Website;

use App\Models\Website;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class WebsiteUpdateController extends Controller
{
    public string $id = '';

    public ?string $name = null;

    public ?string $slug = null;

    public ?string $description = null;

    public ?bool $published = null;

    private const array PATCHABLE_FIELDS = ['name', 'slug', 'description', 'published'];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $website = Website::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$website instanceof Website) {
            return JsonResponse::notFound('Website not found');
        }

        try {
            if ($this->name !== null) {
                $this->validate(['name' => 'string|max:255']);
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
        if ($this->slug !== null && $this->slug !== $website->slug) {
            if (Website::where('slug', '=', $this->slug)->exists()) {
                return JsonResponse::validationError([
                    'slug' => ['This slug is already taken'],
                ]);
            }
        }

        // Snapshot old values for audit
        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $website->{$field};
        }

        // Apply non-null incoming values
        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $website->{$field} = $this->{$field};
            }
        }

        $website->save();

        // Compute diff for audit
        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $website->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'website',
            $website->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::ok($website->toArray());
    }
}
