<?php

namespace App\Controllers\EmailTemplate;

use App\Models\EmailTemplate;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

class EmailTemplateCreateController extends Controller
{
    public string $name = '';

    public string $subject = '';

    public ?string $body_html = null;

    public ?string $body_text = null;

    public ?string $category = null;

    public string $scope = 'personal';

    public function post(): JsonResponse
    {
        $this->validate([
            'name' => 'required|string|max:100',
            'subject' => 'required|string|max:255',
            'scope' => 'required|string|in:personal,office',
        ]);

        $userRole = $this->request->user['role'] ?? 'agent';
        $officeId = $this->request->user['office_id'] ?? null;

        if ($this->scope === 'office' && !in_array($userRole, ['admin', 'manager'])) {
            return JsonResponse::forbidden('Only managers can create office templates');
        }

        $emailTemplate = new EmailTemplate();
        $emailTemplate->name = $this->name;
        $emailTemplate->subject = $this->subject;
        $emailTemplate->body_html = $this->body_html;
        $emailTemplate->body_text = $this->body_text;
        $emailTemplate->category = $this->category;
        $emailTemplate->scope = $this->scope;
        $emailTemplate->office_id = $officeId;
        $emailTemplate->created_by_user_id = $this->request->user['id'];
        $emailTemplate->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'email_template',
            $emailTemplate->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'email_template_created',
            subject: 'Email template created: ' . $emailTemplate->name,
            userId: $this->request->user['id'],
            officeId: $officeId,
        );

        return JsonResponse::created($emailTemplate->toArray());
    }
}
