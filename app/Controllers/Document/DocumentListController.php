<?php

namespace App\Controllers\Document;

use App\Models\Document;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class DocumentListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $query = Document::with(['uploadedByUser'])
            ->where('office_id', '=', $officeId);

        $filters = [
            'category'       => fn ($q, $v) => $q->where('category', '=', $v),
            'estate_id'      => fn ($q, $v) => $q->where('estate_id', '=', $v),
            'contact_id'     => fn ($q, $v) => $q->where('contact_id', '=', $v),
            'appointment_id' => fn ($q, $v) => $q->where('appointment_id', '=', $v),
            'email_id'       => fn ($q, $v) => $q->where('email_id', '=', $v),
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
                $qb->where('file_name', 'LIKE', $searchTerm);
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
