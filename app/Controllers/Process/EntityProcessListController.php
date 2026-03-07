<?php

namespace App\Controllers\Process;

use App\Models\ProcessInstance;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class EntityProcessListController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        // Detect entity type from request path
        $path = $this->request->path ?? '';
        $entityType = str_contains($path, '/estates/') ? 'estate' : 'contact';

        $query = ProcessInstance::with(['template', 'stepInstances'])
            ->where('office_id', '=', $officeId)
            ->where('entity_type', '=', $entityType)
            ->where('entity_id', '=', $this->id);

        $status = $this->request->query['status'] ?? null;
        if ($status !== null && $status !== '') {
            $query = $query->where('status', '=', $status);
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
