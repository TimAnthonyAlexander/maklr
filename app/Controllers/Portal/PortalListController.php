<?php

namespace App\Controllers\Portal;

use App\Models\Portal;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

final class PortalListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        if ($officeId === null) {
            return JsonResponse::ok(['items' => [], 'pagination' => ['page' => 1, 'per_page' => 20, 'total' => 0]]);
        }

        $modelQuery = Portal::query()->where('office_id', '=', $officeId);

        $active = $this->request->query['active'] ?? null;
        if ($active !== null) {
            $modelQuery->where('active', '=', $active === 'true' || $active === '1');
        }

        [$modelQuery, $page, $perPage, $withTotal] = ControllerListHelpers::applyListParams(
            $modelQuery,
            $this->request,
            50,
        );

        $result = $modelQuery->paginate($page, $perPage, 50, $withTotal);

        return JsonResponse::paginated($result);
    }
}
