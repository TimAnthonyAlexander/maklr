<?php

namespace App\Controllers\Task;

use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;
use App\Models\Task;

class TaskListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $query = Task::query()->where('office_id', '=', $officeId);

        $filters = [
            'status'           => fn ($q, $v) => $q->where('status', '=', $v),
            'priority'         => fn ($q, $v) => $q->where('priority', '=', $v),
            'type'             => fn ($q, $v) => $q->where('type', '=', $v),
            'estate_id'        => fn ($q, $v) => $q->where('estate_id', '=', $v),
            'contact_id'       => fn ($q, $v) => $q->where('contact_id', '=', $v),
            'assigned_user_id' => fn ($q, $v) => $q->where('id', 'IN', fn($sub) => $sub->select(['task_id'])
                ->from('task_user')
                ->where('user_id', '=', $v)),
            'created_by_user_id' => fn ($q, $v) => $q->where('created_by_user_id', '=', $v),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        // Due date range
        $dueBefore = $this->request->query['due_before'] ?? null;
        if ($dueBefore !== null && $dueBefore !== '') {
            $query = $query->where('due_date', '<=', $dueBefore);
        }

        $dueAfter = $this->request->query['due_after'] ?? null;
        if ($dueAfter !== null && $dueAfter !== '') {
            $query = $query->where('due_date', '>=', $dueAfter);
        }

        // Quick search on title and task_number
        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $searchTerm = '%' . $search . '%';
            // Check if searching by task number (e.g., "42" or "TASK-42")
            $numericSearch = preg_replace('/^TASK-/i', '', (string) $search);
            if (is_numeric($numericSearch)) {
                $query->qb()->whereGroup(function ($qb) use ($searchTerm, $numericSearch): void {
                    $qb->where('title', 'LIKE', $searchTerm)
                        ->orWhere('task_number', '=', (int) $numericSearch);
                });
            } else {
                $query = $query->where('title', 'LIKE', $searchTerm);
            }
        }

        [$query, $page, $perPage, $withTotal] = ControllerListHelpers::applyListParams(
            $query,
            $this->request,
            50,
        );

        $result = $query->paginate($page, $perPage, 50, true);

        return JsonResponse::paginated($result);
    }
}
