<?php

namespace App\Controllers\Contact;

use App\Models\Contact;
use App\Models\ContactRelationship;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class ContactShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $data = CacheHelper::remember('contact', $this->id, 120, function () use ($officeId): ?array {
            $contact = Contact::with(['relationships', 'activities'])
                ->where('id', '=', $this->id)
                ->where('office_id', '=', $officeId)
                ->first();

            if (!$contact instanceof Contact) {
                return null;
            }

            $contactArray = $contact->toArray(true);

            $contactArray['relationships'] = $this->buildRelationships(
                $contactArray['relationships'] ?? [],
                $this->id,
            );

            return $contactArray;
        });

        if ($data === null) {
            return JsonResponse::notFound('Contact not found');
        }

        return JsonResponse::ok($data);
    }

    /**
     * Merge forward and reverse relationships, enriching each with the
     * "other" contact's details so the frontend always sees a consistent
     * `related_contact` pointing away from the current contact.
     *
     * @param  array<int, array<string, mixed>>  $forwardRelationships
     * @return array<int, array<string, mixed>>
     */
    private function buildRelationships(array $forwardRelationships, string $contactId): array
    {
        // Reverse relationships: rows where this contact is the target
        $reverseRows = ContactRelationship::where('related_contact_id', '=', $contactId)->get();
        $reverseRelationships = array_map(
            fn (ContactRelationship $contactRelationship): array => [
                ...$contactRelationship->toArray(),
                // Flip so `related_contact_id` points to the other side
                'related_contact_id' => $contactRelationship->contact_id,
            ],
            $reverseRows,
        );

        $allRelationships = [...$forwardRelationships, ...$reverseRelationships];

        if ($allRelationships === []) {
            return [];
        }

        // Collect all "other" contact IDs we need to look up
        $otherIds = array_unique(array_filter(array_column($allRelationships, 'related_contact_id')));

        if ($otherIds === []) {
            return $allRelationships;
        }

        $contacts = Contact::query()->qb()
            ->select(['id', 'first_name', 'last_name', 'company_name', 'email', 'entity_type'])
            ->whereIn('id', array_values($otherIds))
            ->get();

        $contactMap = [];
        foreach ($contacts as $contact) {
            $contactMap[$contact['id']] = $contact;
        }

        return array_map(function (array $rel) use ($contactMap): array {
            $relatedId = $rel['related_contact_id'] ?? null;
            $rel['related_contact'] = $contactMap[$relatedId] ?? null;
            return $rel;
        }, $allRelationships);
    }
}
