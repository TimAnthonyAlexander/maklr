<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use App\Models\EstateContact;
use App\Services\ActivityService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EstateContactUnlinkController extends Controller
{
    public string $id = '';

    public string $contact_id = '';

    public ?string $role = null;

    public function delete(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];

        if ($this->contact_id === '') {
            return JsonResponse::badRequest('contact_id is required');
        }

        // Verify estate belongs to office
        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        $query = EstateContact::where('estate_id', '=', $this->id)
            ->where('contact_id', '=', $this->contact_id);

        if ($this->role !== null && $this->role !== '') {
            $query = $query->where('role', '=', $this->role);
        }

        $links = $query->get();

        if ($links === []) {
            return JsonResponse::notFound('Link not found');
        }

        foreach ($links as $link) {
            $link->delete();
        }

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'contact_unlinked_from_estate',
            subject: 'Contact unlinked from estate',
            userId: $userId,
            officeId: $officeId,
            estateId: $this->id,
            contactId: $this->contact_id,
        );

        return JsonResponse::ok(['message' => 'Contact unlinked']);
    }
}
