<?php

namespace App\Controllers\User;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Models\BaseModel;
use App\Middleware\RoleMiddleware;
use App\Models\User;

class UserShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $currentUser = $this->request->user;

        if (!$currentUser) {
            return JsonResponse::unauthorized();
        }

        $isSelf = $currentUser['id'] === $this->id;

        // Self-access always allowed
        if (!$isSelf) {
            $role = $currentUser['role'] ?? 'guest';

            // Must be at least manager to view others
            if (!RoleMiddleware::hasRequiredRole($role, ['manager'])) {
                return JsonResponse::forbidden('Insufficient permissions');
            }

            // Manager: can only view users in the same office
            if ($role === 'manager') {
                $targetUser = User::find($this->id);

                if (!$targetUser instanceof BaseModel || !$targetUser->active) {
                    return JsonResponse::notFound('User not found');
                }

                if ($targetUser->office_id !== ($currentUser['office_id'] ?? null)) {
                    return JsonResponse::forbidden('Cannot view users from other offices');
                }

                $data = $targetUser->jsonSerialize();
                unset($data['password']);

                return JsonResponse::ok($data);
            }
        }

        $user = User::find($this->id);

        if (!$user instanceof BaseModel || !$user->active) {
            return JsonResponse::notFound('User not found');
        }

        $data = $user->jsonSerialize();
        unset($data['password']);

        return JsonResponse::ok($data);
    }
}
