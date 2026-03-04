<?php

namespace App\Controllers\Invitation;

use Throwable;
use App\Models\Invitation;
use App\Models\Office;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\EmailService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

#[Tag('Invitations')]
class CreateInvitationController extends Controller
{
    public string $office_id = '';

    public string $email = '';

    public string $role = 'agent';

    public function __construct(
        private readonly EmailService $emailService,
    ) {}

    public function post(): JsonResponse
    {
        $this->validate([
            'email' => 'required|string|email',
            'role' => 'string|in:agent,manager,admin',
        ]);

        $userData = $this->request->user ?? null;
        if (!$userData || empty($userData['id'])) {
            return JsonResponse::error('Unauthorized', 401);
        }

        $user = User::find($userData['id']);
        if (!$user instanceof User) {
            return JsonResponse::notFound('User not found');
        }

        $office = Office::find($this->office_id);
        if (!$office instanceof Office) {
            return JsonResponse::notFound('Office not found');
        }

        if ($user->office_id !== $office->id) {
            return JsonResponse::forbidden('You do not belong to this office');
        }

        if (!in_array($user->role, ['admin', 'manager'])) {
            return JsonResponse::forbidden('Only admins and managers can create invitations');
        }

        $existingUser = User::firstWhere('email', '=', $this->email);
        if ($existingUser instanceof User) {
            return JsonResponse::badRequest('A user with this email already exists');
        }

        $plainToken = Invitation::generateToken();

        $invitation = new Invitation();
        $invitation->office_id = $office->id;
        $invitation->email = $this->email;
        $invitation->token_hash = Invitation::hashToken($plainToken);
        $invitation->role = $this->role;
        $invitation->invited_by = $user->id;
        $invitation->expires_at = date('Y-m-d H:i:s', strtotime('+7 days'));

        if (!$invitation->save()) {
            return JsonResponse::error('Failed to create invitation', 500);
        }

        $frontendUrl = $_ENV['FRONTEND_URL'] ?? $_ENV['CORS_ALLOWLIST'] ?? 'http://localhost:5173';
        $frontendUrl = explode(',', (string) $frontendUrl)[0];

        $inviteUrl = rtrim($frontendUrl, '/') . '/invite/' . $plainToken;

        try {
            $this->emailService->sendInvitation(
                $this->email,
                $user->name,
                $office->name,
                $inviteUrl,
            );
        } catch (Throwable) {
            // Non-critical: invitation is created even if email fails
        }

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $user->id,
            'created',
            'invitation',
            $invitation->id,
            [],
            ClientIp::from($this->request, true),
            $office->id,
        );

        return JsonResponse::created([
            'id' => $invitation->id,
            'email' => $invitation->email,
            'role' => $invitation->role,
            'office_id' => $invitation->office_id,
            'expires_at' => $invitation->expires_at,
            'invite_url' => $inviteUrl,
            'created_at' => $invitation->created_at,
        ]);
    }
}
