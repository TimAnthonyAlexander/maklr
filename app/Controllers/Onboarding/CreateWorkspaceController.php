<?php

namespace App\Controllers\Onboarding;

use App\Models\Office;
use App\Models\User;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

#[Tag('Onboarding')]
class CreateWorkspaceController extends Controller
{
    public string $office_name = '';

    public ?string $address = null;

    public ?string $city = null;

    public ?string $zip = null;

    public ?string $country = null;

    public ?string $phone = null;

    public ?string $email = null;

    public function post(): JsonResponse
    {
        $this->validate([
            'office_name' => 'required|string|max:255',
        ]);

        $userData = $this->request->user ?? null;
        if (!$userData || empty($userData['id'])) {
            return JsonResponse::error('Unauthorized', 401);
        }

        $user = User::find($userData['id']);
        if (!$user instanceof User) {
            return JsonResponse::notFound('User not found');
        }

        if ($user->office_id !== null) {
            return JsonResponse::badRequest('You already belong to a workspace');
        }

        $office = new Office();
        $office->name = $this->office_name;
        $office->address = $this->address;
        $office->city = $this->city;
        $office->zip = $this->zip;
        $office->country = $this->country;
        $office->phone = $this->phone;
        $office->email = $this->email;
        $office->save();

        $updatedUser = User::find($user->id);
        if (!$updatedUser instanceof User) {
            return JsonResponse::error('Failed to reload user', 500);
        }

        $updatedUser->office_id = $office->id;
        $updatedUser->role = 'admin';
        $updatedUser->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $user->id,
            'created',
            'office',
            $office->id,
            [],
            ClientIp::from($this->request, true),
            $office->id,
        );

        // Update session with new role
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION['user_id'] = $updatedUser->id;
        }

        return JsonResponse::created([
            'office' => $office->toArray(),
            'user' => $updatedUser->jsonSerialize(),
        ]);
    }
}
