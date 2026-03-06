<?php

namespace App\Controllers\Portal;

use App\Models\Portal;
use App\Services\OpenImmo\SyndicationService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

final class PortalSyncController extends Controller
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

        if (!$portal->active) {
            return JsonResponse::badRequest('Portal is inactive');
        }

        /** @var SyndicationService $syndicationService */
        $syndicationService = $this->make(SyndicationService::class);

        $syncResult = $syndicationService->syncPortal($portal, $officeId, $userId);

        return JsonResponse::ok($syncResult->toArray());
    }
}
