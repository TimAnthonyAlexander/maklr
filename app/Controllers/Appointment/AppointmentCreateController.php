<?php

namespace App\Controllers\Appointment;

use App\Models\Appointment;
use App\Services\AppointmentService;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

#[Tag('Appointments')]
class AppointmentCreateController extends Controller
{
    public string $title = '';

    public ?string $description = null;

    public string $type = 'other';

    public ?string $starts_at = null;

    public ?string $ends_at = null;

    public bool $is_all_day = false;

    public ?string $location = null;

    public ?string $estate_id = null;

    /** @var array<string> */
    public array $user_ids = [];

    /** @var array<string> */
    public array $contact_ids = [];

    private const array VALID_TYPES = [
        'viewing', 'meeting', 'call', 'handover', 'inspection',
        'open_house', 'signing', 'valuation', 'photography', 'other',
    ];

    public function post(): JsonResponse
    {
        try {
            $rules = [
                'title' => 'required|string|max:255',
                'type' => 'required|string|in:' . implode(',', self::VALID_TYPES),
                'is_all_day' => 'boolean',
            ];

            if ($this->is_all_day) {
                $rules['starts_at'] = 'required|string';
            } else {
                $rules['starts_at'] = 'required|string';
                $rules['ends_at'] = 'required|string';
            }

            $this->validate($rules);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        /** @var AppointmentService $appointmentService */
        $appointmentService = $this->make(AppointmentService::class);

        $attendeeIds = $this->user_ids !== [] ? $this->user_ids : [$userId];

        $appointment = new Appointment();
        $appointment->title = $this->title;
        $appointment->description = $this->description;
        $appointment->type = $this->type;
        $appointment->is_all_day = $this->is_all_day;
        $appointment->starts_at = $this->starts_at;
        $appointment->ends_at = $this->is_all_day && $this->ends_at === null
            ? $this->starts_at
            : $this->ends_at;
        $appointment->location = $this->location;
        $appointment->estate_id = $this->estate_id;
        $appointment->office_id = $officeId;
        $appointment->created_by_user_id = $userId;
        $appointment->save();

        // Sync junction records
        $appointmentService->syncUsers($appointment->id, $attendeeIds);

        if ($this->contact_ids !== []) {
            $appointmentService->syncContacts($appointment->id, $this->contact_ids);
        }

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'created',
            'appointment',
            $appointment->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'appointment_created',
            subject: 'Appointment created: ' . $appointment->title,
            userId: $userId,
            officeId: $officeId,
            appointmentId: $appointment->id,
            estateId: $appointment->estate_id,
        );

        // Check for scheduling conflicts (warnings only — appointment already saved)
        // All-day appointments don't block time slots, so skip conflict detection
        $conflicts = [];
        if (!$this->is_all_day) {
            $conflicts = $appointmentService->findConflicts(
                $attendeeIds,
                $this->starts_at,
                $this->ends_at,
                $appointment->id,
            );
        }

        $appointment = Appointment::with(['appointmentUsers', 'appointmentContacts', 'estate'])
            ->where('id', '=', $appointment->id)
            ->first();

        $responseData = $appointment instanceof Appointment ? $appointment->toArray(true) : [];
        if ($conflicts !== []) {
            $responseData['conflicts'] = $conflicts;
        }

        return JsonResponse::created($responseData);
    }
}
