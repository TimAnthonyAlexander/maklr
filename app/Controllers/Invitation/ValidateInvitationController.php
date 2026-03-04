<?php

namespace App\Controllers\Invitation;

use App\Models\Invitation;
use App\Models\Office;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\JsonResponse;

#[Tag('Invitations')]
class ValidateInvitationController extends Controller
{
    public string $token = '';

    public function get(): JsonResponse
    {
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

        $office = $invitation->office()->first();
        $officeName = $office instanceof Office ? $office->name : 'Unknown';

        return JsonResponse::ok([
            'email' => $invitation->email,
            'role' => $invitation->role,
            'office_name' => $officeName,
        ]);
    }
}
