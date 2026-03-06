<?php

namespace App\Controllers\Website;

use App\Models\Website;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class WebsiteShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $website = Website::with(['pages'])
            ->where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$website instanceof Website) {
            return JsonResponse::notFound('Website not found');
        }

        return JsonResponse::ok($website->toArray(true));
    }
}
