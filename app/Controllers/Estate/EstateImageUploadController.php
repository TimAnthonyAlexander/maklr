<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use App\Models\EstateImage;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\UploadedFile;
use BaseApi\Http\Validation\Attributes\File;
use BaseApi\Http\Validation\Attributes\Mimes;
use BaseApi\Http\Validation\Attributes\Size;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class EstateImageUploadController extends Controller
{
    public string $id = '';

    #[File]
    #[Mimes(['jpg', 'jpeg', 'png', 'gif', 'webp'])]
    #[Size(10)]
    public ?UploadedFile $file = null;

    public ?string $category = null;

    public ?string $title = null;

    public ?string $alt_text = null;

    public bool $is_primary = false;

    private const array VALID_CATEGORIES = [
        'photo', 'exterior', 'interior', 'floor_plan', 'other',
    ];

    public function post(): JsonResponse
    {
        if (!$this->file instanceof UploadedFile) {
            return JsonResponse::badRequest('File is required');
        }

        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
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

        $storagePath = 'estate-images/' . $officeId . '/' . $this->id;
        $path = $this->file->store($storagePath);

        $sortOrder = EstateImage::where('estate_id', '=', $this->id)->count();

        if ($this->is_primary) {
            $existingPrimary = EstateImage::where('estate_id', '=', $this->id)
                ->where('is_primary', '=', true)
                ->get();
            foreach ($existingPrimary as $img) {
                $img->is_primary = false;
                $img->save();
            }
        }

        $estateImage = new EstateImage();
        $estateImage->estate_id = $this->id;
        $estateImage->file_path = $path;
        $estateImage->file_name = $this->file->name;
        $estateImage->mime_type = $this->file->getMimeType();
        $estateImage->file_size = $this->file->getSize();
        $estateImage->category = $this->category ?? 'photo';
        $estateImage->sort_order = $sortOrder;
        $estateImage->title = $this->title;
        $estateImage->alt_text = $this->alt_text;
        $estateImage->is_primary = $this->is_primary;
        $estateImage->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'estate_image',
            $estateImage->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'image_uploaded',
            subject: 'Image uploaded: ' . $estateImage->file_name,
            userId: $this->request->user['id'],
            officeId: $officeId,
            estateId: $this->id,
        );

        return JsonResponse::created($estateImage->toArray());
    }
}
