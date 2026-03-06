<?php

namespace App\Controllers\Syndication;

use App\Models\Estate;
use App\Models\EstateSyndication;
use App\Models\Portal;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;

final class EstateSyndicationBulkController extends Controller
{
    public string $id = '';

    /** @var array<string> */
    public array $portal_ids = [];

    public bool $enabled = true;

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'portal_ids' => 'required|array',
                'enabled' => 'required|boolean',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        $results = [];

        foreach ($this->portal_ids as $portal_id) {
            $portal = Portal::where('id', '=', $portal_id)
                ->where('office_id', '=', $officeId)
                ->first();

            if (!$portal instanceof Portal) {
                continue;
            }

            $syndication = EstateSyndication::where('estate_id', '=', $this->id)
                ->where('portal_id', '=', $portal_id)
                ->where('office_id', '=', $officeId)
                ->first();

            if (!$syndication instanceof EstateSyndication) {
                $syndication = new EstateSyndication();
                $syndication->estate_id = $this->id;
                $syndication->portal_id = $portal_id;
                $syndication->office_id = $officeId;
            }

            $syndication->enabled = $this->enabled;

            if (!$this->enabled) {
                $syndication->sync_status = 'pending';
            }

            $syndication->save();
            $results[] = $syndication->toArray();
        }

        return JsonResponse::ok(['items' => $results]);
    }
}
