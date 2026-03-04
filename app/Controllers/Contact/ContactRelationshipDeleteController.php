<?php

namespace App\Controllers\Contact;

use App\Models\Contact;
use App\Models\ContactRelationship;
use App\Services\ActivityService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;

class ContactRelationshipDeleteController extends Controller
{
    public string $contactId = '';

    public string $id = '';

    public function delete(): JsonResponse|Response
    {
        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];

        // Verify contact belongs to office
        $contact = Contact::where('id', '=', $this->contactId)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$contact instanceof Contact) {
            return JsonResponse::notFound('Contact not found');
        }

        // Find relationship — allow deletion from either side
        $relationship = ContactRelationship::find($this->id);

        if (!$relationship instanceof ContactRelationship) {
            return JsonResponse::notFound('Relationship not found');
        }

        // Verify the requesting contact is one of the two sides
        $isForward = $relationship->contact_id === $this->contactId;
        $isReverse = $relationship->related_contact_id === $this->contactId;

        if (!$isForward && !$isReverse) {
            return JsonResponse::notFound('Relationship not found');
        }

        $otherContactId = $isForward ? $relationship->related_contact_id : $relationship->contact_id;
        $type = $relationship->type;
        $relationship->delete();

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'relationship_deleted',
            subject: 'Contact relationship removed',
            userId: $userId,
            officeId: $officeId,
            contactId: $this->contactId,
            description: 'Type: ' . $type,
        );

        CacheHelper::forget('contact', $this->contactId);
        CacheHelper::forget('contact', $otherContactId);

        return JsonResponse::noContent();
    }
}
