<?php

namespace App\Controllers\Contact;

use App\Models\Contact;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Support\ClientIp;

class ContactDeleteController extends Controller
{
    public string $id = '';

    public function delete(): Response
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $contact = Contact::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$contact instanceof Contact) {
            return JsonResponse::notFound('Contact not found');
        }

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'contact',
            $contact->id,
            ['name' => ['old' => trim(($contact->first_name ?? '') . ' ' . ($contact->last_name ?? '')), 'new' => null]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $contactName = trim(($contact->first_name ?? '') . ' ' . ($contact->last_name ?? ''));
        $activityService->log(
            type: 'contact_deleted',
            subject: 'Contact deleted: ' . ($contactName ?: 'Unnamed'),
            userId: $this->request->user['id'],
            officeId: $officeId,
            contactId: $contact->id,
        );

        $contact->delete();

        CacheHelper::forget('contact', $this->id);
        CacheHelper::forget('dashboard', $officeId ?? 'none');

        return JsonResponse::noContent();
    }
}
