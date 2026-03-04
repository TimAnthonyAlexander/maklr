<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EstateShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::with(['images'])
            ->where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        return JsonResponse::ok($estate->toArray(true));
    }
}
