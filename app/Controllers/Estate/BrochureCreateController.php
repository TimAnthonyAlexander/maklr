<?php

namespace App\Controllers\Estate;

use Throwable;
use App\Models\Document;
use App\Models\Estate;
use App\Models\EstateImage;
use App\Models\Office;
use App\Models\User;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\BrochureService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Storage\Storage;
use BaseApi\Support\ClientIp;

class BrochureCreateController extends Controller
{
    public string $id = '';

    public string $headline = '';

    public string $description = '';

    /** @var array<string> */
    public array $highlights = [];

    public string $location_summary = '';

    public string $call_to_action = '';

    /** @var array<string> */
    public array $image_ids = [];

    public function __construct(
        private readonly BrochureService $brochureService,
    ) {}

    public function post(): JsonResponse
    {
        $this->validate([
            'headline' => 'required|string|max:255',
            'description' => 'required|string',
            'location_summary' => 'string',
            'call_to_action' => 'string',
        ]);

        $userId = $this->request->user['id'] ?? null;
        $officeId = $this->request->user['office_id'] ?? null;

        if ($userId === null || $officeId === null) {
            return JsonResponse::error('Unauthorized', 401);
        }

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        /** @var array<EstateImage> $allImages */
        $allImages = $estate->images()->get();

        $images = $this->reorderImages($allImages);

        $agent = $estate->assignedUser()->first();
        if (!$agent instanceof User) {
            $agent = User::find($userId);
            if (!$agent instanceof User) {
                $agent = null;
            }
        }

        $office = $estate->office()->first();
        if (!$office instanceof Office) {
            $office = null;
        }

        $content = [
            'headline' => $this->headline,
            'description' => $this->description,
            'highlights' => $this->highlights,
            'location_summary' => $this->location_summary,
            'call_to_action' => $this->call_to_action,
        ];

        try {
            $pdfContent = $this->brochureService->generateWithContent(
                $estate,
                $content,
                $images,
                $agent,
                $office,
            );
        } catch (Throwable $throwable) {
            return JsonResponse::error('Failed to generate brochure: ' . $throwable->getMessage(), 500);
        }

        $ref = $estate->external_id ?? $estate->id;
        $filename = 'brochure-' . $ref . '-' . time() . '.pdf';
        $storagePath = 'documents/' . $officeId . '/' . $filename;

        Storage::put($storagePath, $pdfContent);

        $document = new Document();
        $document->file_path = $storagePath;
        $document->file_name = $filename;
        $document->mime_type = 'application/pdf';
        $document->file_size = strlen($pdfContent);
        $document->category = 'expose';
        $document->office_id = $officeId;
        $document->estate_id = $estate->id;
        $document->uploaded_by_user_id = $userId;
        $document->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'created',
            'document',
            $document->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'document_uploaded',
            subject: 'Brochure created: ' . $filename,
            userId: $userId,
            officeId: $officeId,
            estateId: $estate->id,
        );

        return JsonResponse::created($document->toArray());
    }

    /**
     * Reorder images based on image_ids, falling back to default sort.
     *
     * @param array<EstateImage> $allImages
     * @return array<EstateImage>
     */
    private function reorderImages(array $allImages): array
    {
        if ($this->image_ids === []) {
            return $allImages;
        }

        $imageMap = [];
        foreach ($allImages as $image) {
            $imageMap[$image->id] = $image;
        }

        $ordered = [];
        foreach ($this->image_ids as $imageId) {
            if (isset($imageMap[$imageId])) {
                $ordered[] = $imageMap[$imageId];
            }
        }

        return $ordered !== [] ? $ordered : $allImages;
    }
}
