<?php

namespace App\Controllers\Document;

use App\Models\Document;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use App\Services\DocumentService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

class DocumentDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $document = Document::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$document instanceof Document) {
            return JsonResponse::notFound('Document not found');
        }

        $fileName = $document->file_name;
        $documentId = $document->id;

        /** @var DocumentService $documentService */
        $documentService = $this->make(DocumentService::class);
        $documentService->deleteDocument($document);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'document',
            $documentId,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'document_deleted',
            subject: 'Document deleted: ' . $fileName,
            userId: $this->request->user['id'],
            officeId: $officeId,
        );

        CacheHelper::forget('document', $this->id);

        return JsonResponse::ok(['message' => 'Document deleted']);
    }
}
