<?php

namespace App\Controllers\Estate;

use Throwable;
use App\Models\EstateImage;
use App\Models\Estate;
use App\Models\Office;
use App\Models\User;
use App\Services\BrochureService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;

class EstateBrochureController extends Controller
{
    public string $id = '';

    public string $download = '0';

    public function __construct(
        private readonly BrochureService $brochureService,
    ) {}

    public function get(): JsonResponse|Response
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        /** @var array<EstateImage> $images */
        $images = $estate->images()->get();

        $agent = $estate->assignedUser()->first();
        if (!$agent instanceof User) {
            $userId = $this->request->user['id'] ?? null;
            $agent = $userId !== null ? User::find($userId) : null;
            if (!$agent instanceof User) {
                $agent = null;
            }
        }

        $office = $estate->office()->first();
        if (!$office instanceof Office) {
            $office = null;
        }

        try {
            $pdfContent = $this->brochureService->generate($estate, $images, $agent, $office);
        } catch (Throwable $throwable) {
            return JsonResponse::error('Failed to generate brochure: ' . $throwable->getMessage(), 500);
        }

        $filename = 'brochure-' . ($estate->external_id ?? $estate->id) . '.pdf';
        $disposition = $this->download === '1' ? 'attachment' : 'inline';

        return new Response(
            status: 200,
            headers: [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => $disposition . '; filename="' . $filename . '"',
                'Content-Length' => (string) strlen($pdfContent),
            ],
            body: $pdfContent,
        );
    }
}
