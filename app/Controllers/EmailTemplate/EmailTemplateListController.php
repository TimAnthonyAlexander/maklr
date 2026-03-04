<?php

namespace App\Controllers\EmailTemplate;

use App\Models\EmailTemplate;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class EmailTemplateListController extends Controller
{
    public function get(): JsonResponse
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        $query = EmailTemplate::with(['createdByUser']);

        // Dual visibility: office templates for user's office + personal templates owned by user
        $query->qb()->whereGroup(function ($qb) use ($userId, $officeId): void {
            $qb->whereGroup(function ($qb) use ($officeId): void {
                $qb->where('scope', '=', 'office')
                    ->where('office_id', '=', $officeId);
            })->orWhereGroup(function ($qb) use ($userId): void {
                $qb->where('scope', '=', 'personal')
                    ->where('created_by_user_id', '=', $userId);
            });
        });

        $filters = [
            'scope'    => fn ($q, $v) => $q->where('scope', '=', $v),
            'category' => fn ($q, $v) => $q->where('category', '=', $v),
            'active'   => fn ($q, $v) => $q->where('active', '=', $v === 'true' || $v === '1'),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $searchTerm = '%' . $search . '%';
            $query->qb()->whereGroup(function ($qb) use ($searchTerm): void {
                $qb->where('name', 'LIKE', $searchTerm)
                    ->orWhere('subject', 'LIKE', $searchTerm);
            });
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
