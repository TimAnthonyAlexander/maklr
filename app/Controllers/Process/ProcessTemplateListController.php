<?php

namespace App\Controllers\Process;

use App\Models\ProcessTemplate;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class ProcessTemplateListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $query = ProcessTemplate::query()->where('office_id', '=', $officeId);

        $filters = [
            'entity_type' => fn ($q, $v) => $q->where('entity_type', '=', $v),
            'trigger_type' => fn ($q, $v) => $q->where('trigger_type', '=', $v),
            'active' => fn ($q, $v) => $q->where('active', '=', $v === 'true' || $v === '1'),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $query = $query->where('name', 'LIKE', '%' . $search . '%');
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
