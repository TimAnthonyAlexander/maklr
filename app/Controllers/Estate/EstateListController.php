<?php

namespace App\Controllers\Estate;

use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;
use App\Models\Estate;

class EstateListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $query = Estate::query();
        $query = $query->where('office_id', '=', $officeId);

        $filters = [
            'status'           => fn ($q, $v) => $q->where('status', '=', $v),
            'property_type'    => fn ($q, $v) => $q->where('property_type', '=', $v),
            'marketing_type'   => fn ($q, $v) => $q->where('marketing_type', '=', $v),
            'city'             => fn ($q, $v) => $q->where('city', '=', $v),
            'assigned_user_id' => fn ($q, $v) => $q->where('assigned_user_id', '=', $v),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        // Price range
        $priceMin = $this->request->query['price_min'] ?? null;
        if ($priceMin !== null && $priceMin !== '') {
            $query = $query->where('price', '>=', (float) $priceMin);
        }

        $priceMax = $this->request->query['price_max'] ?? null;
        if ($priceMax !== null && $priceMax !== '') {
            $query = $query->where('price', '<=', (float) $priceMax);
        }

        // Quick search (title, external_id, city)
        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $searchTerm = '%' . $search . '%';
            $query->qb()->whereGroup(function ($qb) use ($searchTerm): void {
                $qb->where('title', 'LIKE', $searchTerm)
                    ->orWhere('external_id', 'LIKE', $searchTerm)
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
