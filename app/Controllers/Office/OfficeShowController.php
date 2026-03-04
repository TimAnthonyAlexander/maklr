<?php

namespace App\Controllers\Office;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Models\BaseModel;
use App\Models\Office;

class OfficeShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $office = Office::where('id', '=', $this->id)
            ->where('active', '=', true)
            ->first();

        if (!$office instanceof BaseModel) {
            return JsonResponse::notFound('Office not found');
        }

        return JsonResponse::ok($office);
    }
}
