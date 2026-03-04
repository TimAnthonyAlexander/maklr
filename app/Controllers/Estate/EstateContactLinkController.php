<?php

namespace App\Controllers\Estate;

use App\Models\Contact;
use App\Models\Estate;
use App\Models\EstateContact;
use App\Services\ActivityService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;

class EstateContactLinkController extends Controller
{
    public string $id = '';

    public string $contact_id = '';

    public string $role = 'interested';

    public ?string $notes = null;

    private const array VALID_ROLES = [
        'owner',
        'buyer',
        'tenant',
        'landlord',
        'interested',
        'agent',
        'other',
    ];

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'contact_id' => 'required|string',
                'role' => 'string|in:' . implode(',', self::VALID_ROLES),
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];

        // Verify estate belongs to office
        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        // Verify contact belongs to same office
        $contact = Contact::where('id', '=', $this->contact_id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$contact instanceof Contact) {
            return JsonResponse::notFound('Contact not found');
        }

        // Idempotent: check for existing link
        $existing = EstateContact::where('estate_id', '=', $this->id)
            ->where('contact_id', '=', $this->contact_id)
            ->where('role', '=', $this->role)
            ->first();

        if ($existing instanceof EstateContact) {
            return JsonResponse::ok($existing->toArray(true));
        }

        $link = new EstateContact();
        $link->estate_id = $this->id;
        $link->contact_id = $this->contact_id;
        $link->role = $this->role;
        $link->notes = $this->notes;
        $link->save();

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'contact_linked_to_estate',
            subject: 'Contact linked to estate',
            userId: $userId,
            officeId: $officeId,
            estateId: $this->id,
            contactId: $this->contact_id,
            description: 'Role: ' . $this->role,
        );

        // Re-fetch with relations
        $link = EstateContact::with(['contact'])
            ->where('id', '=', $link->id)
            ->first();

        return JsonResponse::created($link instanceof EstateContact ? $link->toArray(true) : []);
    }
}
