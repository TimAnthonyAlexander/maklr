<?php

namespace App\Controllers\Document;

use App\Models\Document;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Storage\Storage;

class DocumentDownloadController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse|Response
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $document = Document::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$document instanceof Document) {
            return JsonResponse::notFound('Document not found');
        }

        if (!Storage::exists($document->file_path)) {
            return JsonResponse::notFound('File not found on disk');
        }

        $content = Storage::get($document->file_path);

        return new Response(
            status: 200,
            headers: [
                'Content-Type' => $document->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $document->file_name . '"',
                'Content-Length' => (string) $document->file_size,
            ],
            body: $content,
        );
    }
}
