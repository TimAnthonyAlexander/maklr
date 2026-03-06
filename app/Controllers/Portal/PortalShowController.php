<?php

namespace App\Controllers\Portal;

use App\Models\Portal;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

final class PortalShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $portal = Portal::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$portal instanceof Portal) {
            return JsonResponse::notFound('Portal not found');
        }

        return JsonResponse::ok($portal->toArray());
    }
}
