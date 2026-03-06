<?php

namespace App\Controllers\Portal;

use App\Models\Portal;
use App\Models\SyncLog;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

final class PortalSyncLogController extends Controller
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

        $modelQuery = SyncLog::query()
            ->where('portal_id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->orderBy('created_at', 'DESC');

        [$modelQuery, $page, $perPage, $withTotal] = ControllerListHelpers::applyListParams(
            $modelQuery,
            $this->request,
            50,
        );

        $result = $modelQuery->paginate($page, $perPage, 50, $withTotal);

        return JsonResponse::paginated($result);
    }
}
