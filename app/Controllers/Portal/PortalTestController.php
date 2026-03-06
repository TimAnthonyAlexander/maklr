<?php

namespace App\Controllers\Portal;

use App\Models\Portal;
use App\Services\OpenImmo\FtpSyncService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

final class PortalTestController extends Controller
{
    public string $id = '';

    public function post(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $portal = Portal::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$portal instanceof Portal) {
            return JsonResponse::notFound('Portal not found');
        }

        /** @var FtpSyncService $ftpService */
        $ftpService = $this->make(FtpSyncService::class);

        $result = $ftpService->testConnection($portal);

        if (!$result['success']) {
            $portal->last_error = $result['error'];
            $portal->save();
        } else {
            $portal->last_error = null;
            $portal->save();
        }

        return JsonResponse::ok($result);
    }
}
