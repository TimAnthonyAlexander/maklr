<?php

namespace App\Controllers\Contact;

use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;
use App\Models\Contact;

class ContactListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $query = Contact::query();
        $query = $query->where('office_id', '=', $officeId);

        $filters = [
            'type'             => fn ($q, $v) => $q->where('type', '=', $v),
            'entity_type'      => fn ($q, $v) => $q->where('entity_type', '=', $v),
            'stage'            => fn ($q, $v) => $q->where('stage', '=', $v),
            'assigned_user_id' => fn ($q, $v) => $q->where('assigned_user_id', '=', $v),
            'city'             => fn ($q, $v) => $q->where('city', '=', $v),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        // Quick search (first_name, last_name, company_name, email, phone, city)
        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $searchTerm = '%' . $search . '%';
            $query->qb()->whereGroup(function ($qb) use ($searchTerm): void {
                $qb->where('first_name', 'LIKE', $searchTerm)
                    ->orWhere('last_name', 'LIKE', $searchTerm)
                    ->orWhere('company_name', 'LIKE', $searchTerm)
                    ->orWhere('email', 'LIKE', $searchTerm)
                    ->orWhere('phone', 'LIKE', $searchTerm)
                    ->orWhere('city', 'LIKE', $searchTerm);
            });
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
