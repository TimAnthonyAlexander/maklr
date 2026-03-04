<?php

namespace App\Controllers\Appointment;

use App\Models\AppointmentUser;
use App\Models\Appointment;
use App\Services\AppointmentService;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

#[Tag('Appointments')]
class AppointmentUpdateController extends Controller
{
    public string $id = '';

    public ?string $title = null;

    public ?string $description = null;

    public ?string $type = null;

    public ?string $starts_at = null;

    public ?string $ends_at = null;

    public ?string $location = null;

    public ?string $estate_id = null;

    /** @var array<string>|null */
    public ?array $user_ids = null;

    /** @var array<string>|null */
    public ?array $contact_ids = null;

    private const array VALID_TYPES = [
        'viewing', 'meeting', 'call', 'handover', 'inspection',
        'open_house', 'signing', 'valuation', 'photography', 'other',
    ];

    private const array PATCHABLE_FIELDS = [
        'title', 'description', 'type', 'starts_at', 'ends_at',
        'location', 'estate_id',
    ];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $appointment = Appointment::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$appointment instanceof Appointment) {
            return JsonResponse::notFound('Appointment not found');
        }

        try {
            if ($this->type !== null) {
                $this->validate(['type' => 'string|in:' . implode(',', self::VALID_TYPES)]);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        // Snapshot for audit
        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $appointment->{$field};
        }

        // Apply non-null incoming values
        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $appointment->{$field} = $this->{$field};
            }
        }

        /** @var AppointmentService $appointmentService */
        $appointmentService = $this->make(AppointmentService::class);

        $appointment->save();

        // Sync junction records if provided
        if ($this->user_ids !== null) {
            $appointmentService->syncUsers($appointment->id, $this->user_ids);
        }

        if ($this->contact_ids !== null) {
            $appointmentService->syncContacts($appointment->id, $this->contact_ids);
        }

        // Audit log
        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $appointment->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'appointment',
            $appointment->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        if ($changes !== []) {
            /** @var ActivityService $activityService */
            $activityService = $this->make(ActivityService::class);
            $activityService->log(
                type: 'appointment_updated',
                subject: 'Appointment updated: ' . $appointment->title,
                userId: $this->request->user['id'],
                officeId: $officeId,
                appointmentId: $appointment->id,
                estateId: $appointment->estate_id,
            );
        }

        CacheHelper::forget('appointment', $this->id);

        // Check for conflicts if time or attendees changed
        $timeChanged = ($this->starts_at !== null && $this->starts_at !== $oldData['starts_at'])
            || ($this->ends_at !== null && $this->ends_at !== $oldData['ends_at']);
        $attendeesChanged = $this->user_ids !== null;

        $responseData = $appointment->toArray();

        if ($timeChanged || $attendeesChanged) {
            $currentUserIds = array_map(
                fn ($au): string => $au->user_id,
                AppointmentUser::where('appointment_id', '=', $appointment->id)->get(),
            );
            $conflicts = $appointmentService->findConflicts(
                $currentUserIds,
                $appointment->starts_at,
                $appointment->ends_at,
                $appointment->id,
            );
            if ($conflicts !== []) {
                $responseData['conflicts'] = $conflicts;
            }
        }

        return JsonResponse::ok($responseData);
    }
}
