<?php

namespace App\Controllers\Portal;

use App\Models\Portal;
use App\Services\OpenImmo\FeedbackImportService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

final class FeedbackImportController extends Controller
{
    public string $id = '';

    public function post(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'] ?? '';

        if ($officeId === null) {
            return JsonResponse::badRequest('No office assigned');
        }

        $portal = Portal::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$portal instanceof Portal) {
            return JsonResponse::notFound('Portal not found');
        }

        $files = $this->request->files ?? [];
        $xmlFile = $files['file'] ?? null;

        if ($xmlFile === null || !isset($xmlFile['tmp_name'])) {
            return JsonResponse::badRequest('No XML file uploaded');
        }

        $xmlContent = file_get_contents($xmlFile['tmp_name']);
        if ($xmlContent === false || $xmlContent === '') {
            return JsonResponse::badRequest('Failed to read uploaded file');
        }

        /** @var FeedbackImportService $feedbackService */
        $feedbackService = $this->make(FeedbackImportService::class);

        $result = $feedbackService->importFeedback($xmlContent, $portal->id, $officeId, $userId);

        return JsonResponse::ok($result);
    }
}
