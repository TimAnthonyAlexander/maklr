<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use App\Services\MatchingService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EstateMatchController extends Controller
{
    public string $id = '';

    public function __construct(
        private readonly MatchingService $matchingService,
    ) {}

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        $result = $this->matchingService->matchEstateToContacts($estate, $officeId);

        return JsonResponse::ok($result);
    }
}
