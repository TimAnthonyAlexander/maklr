<?php

namespace App\Controllers\Invitation;

use App\Models\Invitation;
use App\Models\User;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\JsonResponse;

#[Tag('Invitations')]
class AcceptInvitationController extends Controller
{
    public string $token = '';

    public string $name = '';

    public string $email = '';

    public string $password = '';

    public function post(): JsonResponse
    {
        $this->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email',
            'password' => 'required|string|min:8',
        ]);

        $invitation = Invitation::findByToken($this->token);
        if (!$invitation instanceof Invitation) {
            return JsonResponse::notFound('Invalid invitation link');
        }

        if ($invitation->isAccepted()) {
            return JsonResponse::badRequest('This invitation has already been used');
        }

        if ($invitation->isExpired()) {
            return JsonResponse::badRequest('This invitation has expired');
        }

        if (strtolower($this->email) !== strtolower($invitation->email)) {
            return JsonResponse::badRequest('Email does not match the invitation');
        }

        $existingUser = User::firstWhere('email', '=', $this->email);
        if ($existingUser instanceof User) {
            return JsonResponse::error('A user with this email already exists', 409);
        }

        $user = new User();
        $user->name = $this->name;
        $user->email = $this->email;
        $user->password = password_hash($this->password, PASSWORD_DEFAULT);
        $user->role = $invitation->role;
        $user->office_id = $invitation->office_id;
        $user->active = true;

        if (!$user->save()) {
            return JsonResponse::error('Failed to create user', 500);
        }

        $invitation->accepted_at = date('Y-m-d H:i:s');
        $invitation->save();

        $_SESSION['user_id'] = $user->id;

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }

        return JsonResponse::ok($user->jsonSerialize());
    }
}
