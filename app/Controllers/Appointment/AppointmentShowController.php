<?php

namespace App\Controllers\Appointment;

use App\Models\Appointment;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\JsonResponse;

#[Tag('Appointments')]
class AppointmentShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $data = CacheHelper::remember('appointment', $this->id, 300, function () use ($officeId): ?array {
            $appointment = Appointment::with(['appointmentUsers', 'appointmentContacts', 'estate'])
                ->where('id', '=', $this->id)
                ->where('office_id', '=', $officeId)
                ->first();

            if (!$appointment instanceof Appointment) {
                return null;
            }

            return $appointment->toArray(true);
        });

        if ($data === null) {
            return JsonResponse::notFound('Appointment not found');
        }

        return JsonResponse::ok($data);
    }
}
