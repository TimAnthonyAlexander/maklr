<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use App\Models\EstateContact;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class EstateContactListController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        $modelQuery = EstateContact::with(['contact'])
            ->where('estate_id', '=', $this->id)
            ->orderBy('created_at', 'DESC');

        [$modelQuery, $page, $perPage, $withTotal] = ControllerListHelpers::applyListParams(
            $modelQuery,
            $this->request,
            50,
        );

        $result = $modelQuery->paginate($page, $perPage, 50, true);

        $result->data = array_map(
            static fn($model) => $model->toArray(true),
            $result->data,
        );

        return JsonResponse::paginated($result);
    }
}
