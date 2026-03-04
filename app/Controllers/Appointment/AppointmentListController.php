<?php

namespace App\Controllers\Appointment;

use App\Models\Appointment;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

#[Tag('Appointments')]
class AppointmentListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $query = Appointment::query()->where('office_id', '=', $officeId);

        $filters = [
            'type' => fn ($q, $v) => $q->where('type', '=', $v),
            'estate_id' => fn ($q, $v) => $q->where('estate_id', '=', $v),
            'user_id' => fn ($q, $v) => $q->where('id', 'IN', fn($sub) => $sub->select(['appointment_id'])
                ->from('appointment_user')
                ->where('user_id', '=', $v)),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        $startsAfter = $this->request->query['starts_after'] ?? null;
        if ($startsAfter !== null && $startsAfter !== '') {
            $query = $query->where('starts_at', '>=', $startsAfter);
        }

        $startsBefore = $this->request->query['starts_before'] ?? null;
        if ($startsBefore !== null && $startsBefore !== '') {
            $query = $query->where('starts_at', '<=', $startsBefore);
        }

        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $query = $query->where('title', 'LIKE', '%' . $search . '%');
        }

        [$query, $page, $perPage, $withTotal] = ControllerListHelpers::applyListParams(
            $query,
            $this->request,
            200,
        );

        $result = $query->orderBy('starts_at', 'ASC')->paginate($page, $perPage, 200, true);

        return JsonResponse::paginated($result);
    }
}
