<?php

namespace App\Controllers\Process;

use App\Models\ProcessInstance;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class ProcessInstanceListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $query = ProcessInstance::with(['template'])
            ->where('office_id', '=', $officeId);

        $filters = [
            'status' => fn ($q, $v) => $q->where('status', '=', $v),
            'entity_type' => fn ($q, $v) => $q->where('entity_type', '=', $v),
            'entity_id' => fn ($q, $v) => $q->where('entity_id', '=', $v),
            'process_template_id' => fn ($q, $v) => $q->where('process_template_id', '=', $v),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        [$query, $page, $perPage] = ControllerListHelpers::applyListParams(
            $query,
            $this->request,
            50,
        );

        $result = $query->paginate($page, $perPage, 50, true);

        return JsonResponse::paginated($result);
    }
}
