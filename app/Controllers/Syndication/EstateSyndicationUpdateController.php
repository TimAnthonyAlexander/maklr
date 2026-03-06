<?php

namespace App\Controllers\Syndication;

use App\Models\EstateSyndication;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

final class EstateSyndicationUpdateController extends Controller
{
    public string $id = '';

    public string $syndicationId = '';

    public ?bool $enabled = null;

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $syndication = EstateSyndication::where('id', '=', $this->syndicationId)
            ->where('estate_id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$syndication instanceof EstateSyndication) {
            return JsonResponse::notFound('Syndication not found');
        }

        if ($this->enabled !== null) {
            $syndication->enabled = $this->enabled;

            if (!$this->enabled) {
                $syndication->sync_status = 'pending';
            }

            $syndication->save();
        }

        return JsonResponse::ok($syndication->toArray());
    }
}
