<?php

namespace App\Controllers\User;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Models\BaseModel;
use BaseApi\Support\ClientIp;
use App\Models\Office;
use App\Models\User;
use App\Services\AuditLogService;

class UserCreateController extends Controller
{
    public string $name = '';

    public string $email = '';

    public string $password = '';

    public string $role = 'guest';

    public ?string $office_id = null;

    public ?string $phone = null;

    public ?string $avatar_url = null;

    private const array VALID_ROLES = ['guest', 'api_user', 'readonly', 'agent', 'manager', 'admin'];

    public function post(): JsonResponse
    {
        $this->validate([
            'name' => 'required|string',
            'email' => 'required|string|email',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
        ]);

        if (!in_array($this->role, self::VALID_ROLES, true)) {
            return JsonResponse::badRequest('Invalid role');
        }

        // Check email uniqueness
        if (User::exists('email', '=', $this->email)) {
            return JsonResponse::badRequest('Email already in use');
        }

        // Validate office exists if provided
        if ($this->office_id !== null) {
            $office = Office::find($this->office_id);
            if (!$office instanceof BaseModel || !$office->active) {
                return JsonResponse::badRequest('Office not found');
            }
        }

        $user = new User();
        $user->name = $this->name;
        $user->email = $this->email;
        $user->password = password_hash($this->password, PASSWORD_DEFAULT);
        $user->role = $this->role;
        $user->office_id = $this->office_id;
        $user->phone = $this->phone;
        $user->avatar_url = $this->avatar_url;
        $user->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'user',
            $user->id,
            [],
            ClientIp::from($this->request, true),
            $this->request->user['office_id'] ?? null,
        );

        $data = $user->jsonSerialize();
        unset($data['password']);

        return JsonResponse::created($data);
    }
}
