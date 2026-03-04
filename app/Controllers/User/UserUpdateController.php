<?php

namespace App\Controllers\User;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Models\BaseModel;
use BaseApi\Support\ClientIp;
use App\Middleware\RoleMiddleware;
use App\Models\User;
use App\Services\AuditLogService;

class UserUpdateController extends Controller
{
    public string $id = '';

    public ?string $name = null;

    public ?string $email = null;

    public ?string $password = null;

    public ?string $role = null;

    public ?string $office_id = null;

    public ?string $phone = null;

    public ?string $avatar_url = null;

    private const array SELF_UPDATABLE = ['name', 'phone', 'avatar_url'];

    private const array MANAGER_UPDATABLE = ['name', 'email', 'password', 'phone', 'avatar_url'];

    private const array ADMIN_UPDATABLE = ['name', 'email', 'password', 'role', 'office_id', 'phone', 'avatar_url'];

    public function patch(): JsonResponse
    {
        $currentUser = $this->request->user;

        if (!$currentUser) {
            return JsonResponse::unauthorized();
        }

        $targetUser = User::find($this->id);

        if (!$targetUser instanceof BaseModel || !$targetUser->active) {
            return JsonResponse::notFound('User not found');
        }

        $currentRole = $currentUser['role'] ?? 'guest';
        $isSelf = $currentUser['id'] === $this->id;

        // Determine which fields this user can update
        $allowedFields = match (true) {
            RoleMiddleware::hasRequiredRole($currentRole, ['admin']) => self::ADMIN_UPDATABLE,
            RoleMiddleware::hasRequiredRole($currentRole, ['manager']) => $this->getManagerAllowedFields($currentUser, $targetUser),
            $isSelf => self::SELF_UPDATABLE,
            default => [],
        };

        if ($allowedFields === []) {
            return JsonResponse::forbidden('Insufficient permissions');
        }

        // Capture old data for audit (exclude password)
        $trackedFields = array_filter(self::ADMIN_UPDATABLE, fn (string $f): bool => $f !== 'password');
        $oldData = [];
        foreach ($trackedFields as $field) {
            $oldData[$field] = $targetUser->{$field};
        }

        // Apply only allowed non-null fields
        foreach ($allowedFields as $allowedField) {
            if ($this->{$allowedField} !== null) {
                $value = $this->{$allowedField};

                if ($allowedField === 'password') {
                    $value = password_hash((string) $value, PASSWORD_DEFAULT);
                }

                $targetUser->{$allowedField} = $value;
            }
        }

        $targetUser->save();

        // Compute changes for audit
        $newData = [];
        foreach ($trackedFields as $trackedField) {
            $newData[$trackedField] = $targetUser->{$trackedField};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, $trackedFields);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $currentUser['id'],
            'updated',
            'user',
            $targetUser->id,
            $changes,
            ClientIp::from($this->request, true),
            $currentUser['office_id'] ?? null,
        );

        $data = $targetUser->jsonSerialize();
        unset($data['password']);

        return JsonResponse::ok($data);
    }

    /**
     * Manager can update users in the same office, but not role or office_id.
     *
     * @return array<string>
     */
    private function getManagerAllowedFields(array $currentUser, User $targetUser): array
    {
        $isSelf = $currentUser['id'] === $targetUser->id;

        if ($isSelf) {
            return self::SELF_UPDATABLE;
        }

        $managerOfficeId = $currentUser['office_id'] ?? null;
        if ($managerOfficeId === null || $targetUser->office_id !== $managerOfficeId) {
            return [];
        }

        return self::MANAGER_UPDATABLE;
    }
}
