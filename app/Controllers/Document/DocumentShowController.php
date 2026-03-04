<?php

namespace App\Controllers\Document;

use App\Models\Document;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class DocumentShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $data = CacheHelper::remember('document', $this->id, 300, function () use ($officeId): ?array {
            $document = Document::with(['uploadedByUser', 'estate', 'contact'])
                ->where('id', '=', $this->id)
                ->where('office_id', '=', $officeId)
                ->first();

            if (!$document instanceof Document) {
                return null;
            }

            return $document->toArray(true);
        });

        if ($data === null) {
            return JsonResponse::notFound('Document not found');
        }

        return JsonResponse::ok($data);
    }
}
