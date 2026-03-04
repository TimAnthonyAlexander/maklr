<?php

namespace App\Services;

use App\Models\Document;
use BaseApi\App;
use BaseApi\Storage\Storage;
use Throwable;

class DocumentService
{
    public function deleteDocument(Document $document): bool
    {
        try {
            if (Storage::exists($document->file_path)) {
                Storage::delete($document->file_path);
            }
        } catch (Throwable $throwable) {
            App::logger()->error('document_file_delete_failed', [
                'document_id' => $document->id,
                'file_path' => $document->file_path,
                'error' => $throwable->getMessage(),
            ]);
        }

        $document->delete();

        return true;
    }
}
