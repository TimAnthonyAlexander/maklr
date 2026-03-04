<?php

namespace App\Controllers\EmailTemplate;

use App\Models\EmailTemplate;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

class EmailTemplateDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;
        $userRole = $this->request->user['role'] ?? 'agent';

        $template = EmailTemplate::where('id', '=', $this->id)->first();

        if (!$template instanceof EmailTemplate) {
            return JsonResponse::notFound('Email template not found');
        }

        if ($template->scope === 'office') {
            if ($template->office_id !== $officeId || !in_array($userRole, ['admin', 'manager'])) {
                return JsonResponse::notFound('Email template not found');
            }
        } elseif ($template->created_by_user_id !== $userId) {
            return JsonResponse::notFound('Email template not found');
        }

        $templateName = $template->name;
        $templateId = $template->id;

        $template->delete();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'deleted',
            'email_template',
            $templateId,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'email_template_deleted',
            subject: 'Email template deleted: ' . $templateName,
            userId: $userId,
            officeId: $officeId,
        );

        return JsonResponse::ok(['message' => 'Email template deleted']);
    }
}
