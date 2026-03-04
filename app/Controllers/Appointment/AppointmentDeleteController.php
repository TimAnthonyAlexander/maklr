<?php

namespace App\Controllers\Appointment;

use App\Models\Appointment;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

#[Tag('Appointments')]
class AppointmentDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $appointment = Appointment::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$appointment instanceof Appointment) {
            return JsonResponse::notFound('Appointment not found');
        }

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'appointment',
            $appointment->id,
            ['title' => ['old' => $appointment->title, 'new' => null]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'appointment_deleted',
            subject: 'Appointment deleted: ' . $appointment->title,
            userId: $this->request->user['id'],
            officeId: $officeId,
            appointmentId: $appointment->id,
        );

        $appointment->delete();

        CacheHelper::forget('appointment', $this->id);

        return new JsonResponse(null, 204);
    }
}
