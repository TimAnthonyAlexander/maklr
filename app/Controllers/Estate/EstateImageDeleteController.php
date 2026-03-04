<?php

namespace App\Controllers\Estate;

use Throwable;
use App\Models\Estate;
use App\Models\EstateImage;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;
use BaseApi\Storage\Storage;

class EstateImageDeleteController extends Controller
{
    public string $id = '';

    public string $imageId = '';

    public function delete(): JsonResponse
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

        $fileName = $image->file_name;
        $imageId = $image->id;

        try {
            if (Storage::exists($image->file_path)) {
                Storage::delete($image->file_path);
            }
        } catch (Throwable) {
            // Log but don't fail — DB record will still be removed
        }

        $image->delete();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'estate_image',
            $imageId,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'image_deleted',
            subject: 'Image deleted: ' . $fileName,
            userId: $this->request->user['id'],
            officeId: $officeId,
            estateId: $this->id,
        );

        return JsonResponse::ok(['message' => 'Image deleted']);
    }
}
