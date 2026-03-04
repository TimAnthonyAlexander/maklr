<?php

namespace App\Controllers\Activity;

use App\Services\ActivityService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;

class ActivityCreateController extends Controller
{
    public string $type = '';

    public string $subject = '';

    public ?string $description = null;

    public ?string $estate_id = null;

    public ?string $contact_id = null;

    private const array MANUAL_TYPES = ['phone_call', 'meeting', 'note', 'viewing'];

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'type' => 'required|string|in:' . implode(',', self::MANUAL_TYPES),
                'subject' => 'required|string|max:255',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);

        $activityService->log(
            type: $this->type,
            subject: $this->subject,
            userId: $userId,
            officeId: $officeId,
            description: $this->description,
            estateId: $this->estate_id,
            contactId: $this->contact_id,
        );

        if ($this->contact_id !== null) {
            CacheHelper::forget('contact', $this->contact_id);
        }

        return JsonResponse::created(['message' => 'Activity created']);
    }
}
