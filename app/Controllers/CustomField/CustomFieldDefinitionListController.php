<?php

namespace App\Controllers\CustomField;

use App\Models\CustomFieldDefinition;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;

class CustomFieldDefinitionListController extends Controller
{
    public ?string $entity_type = null;

    public ?string $active = null;

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $modelQuery = CustomFieldDefinition::query()->where('office_id', '=', $officeId);

        if ($this->entity_type !== null) {
            $entityType = $this->entity_type;
            $modelQuery->qb()->whereGroup(function ($qb) use ($entityType): void {
                $qb->where('entity_type', '=', $entityType)
                    ->orWhere('entity_type', '=', 'both');
            });
        }

        if ($this->active !== null) {
            $modelQuery->where('active', '=', $this->active === '1');
        }

        $modelQuery->orderBy('sort_order', 'ASC');

        [$modelQuery, $page, $perPage, $withTotal] = ControllerListHelpers::applyListParams(
            $modelQuery,
            $this->request,
            100,
        );

        $result = $modelQuery->paginate($page, $perPage, 100, true);

        return JsonResponse::paginated($result);
    }
}
