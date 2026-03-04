<?php

namespace App\Controllers\Office;

use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;
use App\Models\Office;

class OfficeListController extends Controller
{
    public function get(): JsonResponse
    {
        $modelQuery = Office::where('active', '=', true);

        [$modelQuery, $page, $perPage, $withTotal] = ControllerListHelpers::applyListParams(
            $modelQuery,
            $this->request,
            50,
        );

        $result = $modelQuery->paginate($page, $perPage, 50, true);

        return JsonResponse::paginated($result);
    }
}
