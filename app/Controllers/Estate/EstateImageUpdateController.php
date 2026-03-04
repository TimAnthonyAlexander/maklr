<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use App\Models\EstateImage;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class EstateImageUpdateController extends Controller
{
    public string $id = '';

    public string $imageId = '';

    public ?int $sort_order = null;

    public ?string $title = null;

    public ?string $alt_text = null;

    public ?bool $is_primary = null;

    public ?string $category = null;

    private const array VALID_CATEGORIES = [
        'photo', 'exterior', 'interior', 'floor_plan', 'other',
    ];

    private const array PATCHABLE_FIELDS = [
        'sort_order', 'title', 'alt_text', 'is_primary', 'category',
    ];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        $image = EstateImage::where('id', '=', $this->imageId)
            ->where('estate_id', '=', $this->id)
            ->first();

        if (!$image instanceof EstateImage) {
            return JsonResponse::notFound('Image not found');
        }

        try {
            $rules = [];
            if ($this->category !== null) {
                $rules['category'] = 'string|in:' . implode(',', self::VALID_CATEGORIES);
            }

            if ($this->title !== null) {
                $rules['title'] = 'string|max:255';
            }

            if ($this->alt_text !== null) {
                $rules['alt_text'] = 'string|max:255';
            }

            if ($rules !== []) {
                $this->validate($rules);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        if ($this->is_primary === true) {
            $existingPrimary = EstateImage::where('estate_id', '=', $this->id)
                ->where('is_primary', '=', true)
                ->where('id', '!=', $image->id)
                ->get();
            foreach ($existingPrimary as $img) {
                $img->is_primary = false;
                $img->save();
            }
        }

        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $image->{$field};
        }

        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $image->{$field} = $this->{$field};
            }
        }

        $image->save();

        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $image->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'estate_image',
            $image->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::ok($image->toArray());
    }
}
