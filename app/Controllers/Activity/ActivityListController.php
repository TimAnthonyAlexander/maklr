<?php

namespace App\Controllers\Activity;

use App\Models\Activity;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class ActivityListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $query = Activity::with(['user'])
            ->where('office_id', '=', $officeId);

        $filters = [
            'type'       => fn ($q, $v) => $q->where('type', '=', $v),
            'estate_id'  => fn ($q, $v) => $q->where('estate_id', '=', $v),
            'contact_id' => fn ($q, $v) => $q->where('contact_id', '=', $v),
            'user_id'    => fn ($q, $v) => $q->where('user_id', '=', $v),
            'task_id'    => fn ($q, $v) => $q->where('task_id', '=', $v),
            'email_id'   => fn ($q, $v) => $q->where('email_id', '=', $v),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        // Date range filters
        $dateFrom = $this->request->query['date_from'] ?? null;
        if ($dateFrom !== null && $dateFrom !== '') {
            $query = $query->where('created_at', '>=', $dateFrom);
        }

        $dateTo = $this->request->query['date_to'] ?? null;
        if ($dateTo !== null && $dateTo !== '') {
            $query = $query->where('created_at', '<=', $dateTo . ' 23:59:59');
        }

        // Quick search (subject, description)
        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $searchTerm = '%' . $search . '%';
            $query->qb()->whereGroup(function ($qb) use ($searchTerm): void {
                $qb->where('subject', 'LIKE', $searchTerm)
                    ->orWhere('description', 'LIKE', $searchTerm);
            });
        }

        // Default sort: newest first
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
