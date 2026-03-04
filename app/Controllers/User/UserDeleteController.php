<?php

namespace App\Controllers\User;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Models\BaseModel;
use BaseApi\Support\ClientIp;
use App\Models\User;
use App\Services\AuditLogService;

class UserDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $currentUser = $this->request->user;

        // Cannot deactivate self
        if ($currentUser['id'] === $this->id) {
            return JsonResponse::badRequest('Cannot deactivate your own account');
        }

        $user = User::find($this->id);

        if (!$user instanceof BaseModel || !$user->active) {
            return JsonResponse::notFound('User not found');
        }

        $user->active = false;
        $user->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $currentUser['id'],
            'deleted',
            'user',
            $user->id,
            ['active' => ['old' => true, 'new' => false]],
            ClientIp::from($this->request, true),
            $currentUser['office_id'] ?? null,
        );

        return JsonResponse::ok(['message' => 'User deactivated']);
    }
}
