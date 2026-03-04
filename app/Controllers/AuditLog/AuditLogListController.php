<?php

namespace App\Controllers\AuditLog;

use App\Models\AuditLog;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\JsonResponse;

#[Tag('AuditLog')]
class AuditLogListController extends Controller
{
    public function get(): JsonResponse
    {
        $role = $this->request->user['role'] ?? '';
        if (!in_array($role, ['admin', 'manager'], true)) {
            return JsonResponse::forbidden('Insufficient permissions');
        }

        $officeId = $this->request->user['office_id'] ?? null;

        $query = AuditLog::with(['user'])
            ->where('office_id', '=', $officeId);

        $filters = [
            'entity_type' => fn ($q, $v) => $q->where('entity_type', '=', $v),
            'entity_id'   => fn ($q, $v) => $q->where('entity_id', '=', $v),
            'action'      => fn ($q, $v) => $q->where('action', '=', $v),
            'user_id'     => fn ($q, $v) => $q->where('user_id', '=', $v),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        // Date range filters
        $from = $this->request->query['from'] ?? null;
        if ($from !== null && $from !== '') {
            $query = $query->where('created_at', '>=', $from);
        }

        $to = $this->request->query['to'] ?? null;
        if ($to !== null && $to !== '') {
            $query = $query->where('created_at', '<=', $to . ' 23:59:59');
        }

        $query = $query->orderBy('created_at', 'DESC');

        [$query, $page, $perPage, $withTotal] = ControllerListHelpers::applyListParams(
            $query,
            $this->request,
            50,
        );

        $result = $query->paginate($page, $perPage, 50, true);

        return JsonResponse::paginated($result);
    }
}
