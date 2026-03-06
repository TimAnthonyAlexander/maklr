<?php

namespace App\Controllers\Website;

use App\Models\Website;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class WebsiteListController extends Controller
{
    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $query = Website::query()->where('office_id', '=', $officeId);

        // Quick search
        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $searchTerm = '%' . $search . '%';
            $query->qb()->whereGroup(function ($qb) use ($searchTerm): void {
                $qb->where('name', 'LIKE', $searchTerm)
                    ->orWhere('slug', 'LIKE', $searchTerm);
            });
        }

        // Filter by published status
        $published = $this->request->query['published'] ?? null;
        if ($published !== null && $published !== '') {
            $query = $query->where('published', '=', $published === 'true' || $published === '1');
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
