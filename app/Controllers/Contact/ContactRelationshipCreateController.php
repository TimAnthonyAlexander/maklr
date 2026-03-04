<?php

namespace App\Controllers\Contact;

use App\Models\Contact;
use App\Models\ContactRelationship;
use App\Services\ActivityService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;

class ContactRelationshipCreateController extends Controller
{
    public string $id = '';

    public string $related_contact_id = '';

    public string $type = '';

    public ?string $notes = null;

    private const array VALID_TYPES = [
        'spouse',
        'partner',
        'employer',
        'employee',
        'referral',
        'colleague',
        'relative',
        'other',
    ];

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'related_contact_id' => 'required|string',
                'type' => 'required|string|in:' . implode(',', self::VALID_TYPES),
                'notes' => 'string',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        if ($this->id === $this->related_contact_id) {
            return JsonResponse::badRequest('Cannot create a relationship with the same contact');
        }

        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];

        // Verify contact belongs to office
        $contact = Contact::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$contact instanceof Contact) {
            return JsonResponse::notFound('Contact not found');
        }

        // Verify related contact belongs to same office
        $relatedContact = Contact::where('id', '=', $this->related_contact_id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$relatedContact instanceof Contact) {
            return JsonResponse::notFound('Related contact not found');
        }

        // Idempotent: check for existing relationship
        $existing = ContactRelationship::where('contact_id', '=', $this->id)
            ->where('related_contact_id', '=', $this->related_contact_id)
            ->where('type', '=', $this->type)
            ->first();

        if ($existing instanceof ContactRelationship) {
            $data = $existing->toArray();
            $data['related_contact'] = [
                'id' => $relatedContact->id,
                'first_name' => $relatedContact->first_name,
                'last_name' => $relatedContact->last_name,
                'company_name' => $relatedContact->company_name,
                'email' => $relatedContact->email,
                'entity_type' => $relatedContact->entity_type,
            ];
            return JsonResponse::ok($data);
        }

        $contactRelationship = new ContactRelationship();
        $contactRelationship->contact_id = $this->id;
        $contactRelationship->related_contact_id = $this->related_contact_id;
        $contactRelationship->type = $this->type;
        $contactRelationship->notes = $this->notes;
        $contactRelationship->save();

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'relationship_created',
            subject: 'Contact relationship created',
            userId: $userId,
            officeId: $officeId,
            contactId: $this->id,
            description: 'Type: ' . $this->type,
        );

        CacheHelper::forget('contact', $this->id);

        $data = $contactRelationship->toArray();
        $data['related_contact'] = [
            'id' => $relatedContact->id,
            'first_name' => $relatedContact->first_name,
            'last_name' => $relatedContact->last_name,
            'company_name' => $relatedContact->company_name,
            'email' => $relatedContact->email,
            'entity_type' => $relatedContact->entity_type,
        ];

        return JsonResponse::created($data);
    }
}
