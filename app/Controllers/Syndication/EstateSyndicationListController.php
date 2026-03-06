<?php

namespace App\Controllers\Syndication;

use App\Models\Estate;
use App\Models\EstateSyndication;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

final class EstateSyndicationListController extends Controller
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

        $syndications = EstateSyndication::with(['portal'])
            ->where('estate_id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->get();

        $items = array_map(
            static fn (EstateSyndication $estateSyndication): array => $estateSyndication->toArray(true),
            $syndications,
        );

        return JsonResponse::ok(['items' => $items]);
    }
}
