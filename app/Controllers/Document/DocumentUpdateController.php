<?php

namespace App\Controllers\Document;

use App\Models\Appointment;
use App\Models\Contact;
use App\Models\Document;
use App\Models\Email;
use App\Models\Estate;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class DocumentUpdateController extends Controller
{
    public string $id = '';

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

    private const array PATCHABLE_FIELDS = [
        'category', 'estate_id', 'contact_id', 'appointment_id', 'email_id',
    ];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $document = Document::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$document instanceof Document) {
            return JsonResponse::notFound('Document not found');
        }

        try {
            if ($this->category !== null) {
                $this->validate(['category' => 'string|in:' . implode(',', self::VALID_CATEGORIES)]);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        // Verify entity FKs belong to same office
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

        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $document->{$field};
        }

        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $document->{$field} = $this->{$field};
            }
        }

        $document->save();

        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $document->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'document',
            $document->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        CacheHelper::forget('document', $this->id);

        return JsonResponse::ok($document->toArray());
    }
}
