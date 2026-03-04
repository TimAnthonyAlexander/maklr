<?php

namespace App\Controllers\User;

use BaseApi\Database\PaginatedResult;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;
use App\Models\User;

class UserListController extends Controller
{
    public function get(): JsonResponse
    {
        $currentUser = $this->request->user;
        $role = $currentUser['role'] ?? 'guest';

        $query = User::query();

        // Active filter (defaults to active-only)
        $activeParam = $this->request->query['active'] ?? '1';
        if ($activeParam !== 'all') {
            $query = $query->where('active', '=', $activeParam === '1');
        }

        // Manager: scoped to own office
        if ($role === 'manager') {
            $officeId = $currentUser['office_id'] ?? null;
            if ($officeId === null) {
                return JsonResponse::ok([]);
            }

            $query = $query->where('office_id', '=', $officeId);
        }

        // Role filter
        $roleFilter = $this->request->query['role'] ?? null;
        if ($roleFilter !== null && $roleFilter !== '') {
            $query = $query->where('role', '=', $roleFilter);
        }

        // Quick search (name, email)
        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $searchTerm = '%' . $search . '%';
            $query->qb()->whereGroup(function ($qb) use ($searchTerm): void {
                $qb->where('name', 'LIKE', $searchTerm)
                    ->orWhere('email', 'LIKE', $searchTerm);
            });
        }

        [$query, $page, $perPage] = ControllerListHelpers::applyListParams(
            $query,
            $this->request,
            50,
        );

        $result = $query->paginate($page, $perPage, 50, true);

        // Strip password from output
        $data = array_map(fn (User $user): array => $this->stripPassword($user), $result->data);

        return JsonResponse::paginated(
            new PaginatedResult($data, $result->page, $result->perPage, $result->total),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function stripPassword(User $user): array
    {
        $data = $user->jsonSerialize();
        unset($data['password']);

        return $data;
    }
}
