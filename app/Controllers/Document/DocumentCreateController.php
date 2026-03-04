<?php

namespace App\Controllers\Document;

use App\Models\Appointment;
use App\Models\Contact;
use App\Models\Document;
use App\Models\Email;
use App\Models\Estate;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\UploadedFile;
use BaseApi\Http\Validation\Attributes\File;
use BaseApi\Http\Validation\Attributes\Mimes;
use BaseApi\Http\Validation\Attributes\Size;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class DocumentCreateController extends Controller
{
    #[File]
    #[Mimes(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'csv', 'txt', 'zip'])]
    #[Size(25)]
    public ?UploadedFile $file = null;

    public ?string $category = null;

    public ?string $estate_id = null;

    public ?string $contact_id = null;

    public ?string $appointment_id = null;

    public ?string $email_id = null;

    private const array VALID_CATEGORIES = [
        'photo', 'floor_plan', 'contract', 'id_document',
        'energy_certificate', 'expose', 'invoice', 'protocol',
        'correspondence', 'other',
    ];

    public function post(): JsonResponse
    {
        if (!$this->file instanceof UploadedFile) {
            return JsonResponse::badRequest('File is required');
        }

        try {
            $rules = [];
            if ($this->category !== null) {
                $rules['category'] = 'string|in:' . implode(',', self::VALID_CATEGORIES);
            }

            if ($rules !== []) {
                $this->validate($rules);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;

        // Verify entity FKs belong to the same office
        if ($this->estate_id !== null) {
            $estate = Estate::where('id', '=', $this->estate_id)
                ->where('office_id', '=', $officeId)
                ->first();
            if (!$estate instanceof Estate) {
                return JsonResponse::badRequest('Estate not found');
            }
        }

        if ($this->contact_id !== null) {
            $contact = Contact::where('id', '=', $this->contact_id)
                ->where('office_id', '=', $officeId)
                ->first();
            if (!$contact instanceof Contact) {
                return JsonResponse::badRequest('Contact not found');
            }
        }

        if ($this->appointment_id !== null) {
            $appointment = Appointment::where('id', '=', $this->appointment_id)
                ->where('office_id', '=', $officeId)
                ->first();
            if (!$appointment instanceof Appointment) {
                return JsonResponse::badRequest('Appointment not found');
            }
        }

        if ($this->email_id !== null) {
            $email = Email::where('id', '=', $this->email_id)
                ->where('office_id', '=', $officeId)
                ->first();
            if (!$email instanceof Email) {
                return JsonResponse::badRequest('Email not found');
            }
        }

        $storagePath = 'documents/' . $officeId;
        $path = $this->file->store($storagePath);

        $document = new Document();
        $document->file_path = $path;
        $document->file_name = $this->file->name;
        $document->mime_type = $this->file->getMimeType();
        $document->file_size = $this->file->getSize();
        $document->category = $this->category;
        $document->office_id = $officeId;
        $document->estate_id = $this->estate_id;
        $document->contact_id = $this->contact_id;
        $document->appointment_id = $this->appointment_id;
        $document->email_id = $this->email_id;
        $document->uploaded_by_user_id = $this->request->user['id'];
        $document->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'document',
            $document->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'document_uploaded',
            subject: 'Document uploaded: ' . $document->file_name,
            userId: $this->request->user['id'],
            officeId: $officeId,
            estateId: $this->estate_id,
            contactId: $this->contact_id,
        );

        return JsonResponse::created($document->toArray());
    }
}
