<?php

namespace App\Controllers\EmailTemplate;

use App\Models\EmailTemplate;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

class EmailTemplateUpdateController extends Controller
{
    public string $id = '';

    public ?string $name = null;

    public ?string $subject = null;

    public ?string $body_html = null;

    public ?string $body_text = null;

    public ?string $category = null;

    public ?bool $active = null;

    private const array PATCHABLE_FIELDS = [
        'name', 'subject', 'body_html', 'body_text', 'category', 'active',
    ];

    public function patch(): JsonResponse
    {
        $template = $this->findEditableTemplate($this->id);

        if (!$template instanceof EmailTemplate) {
            return JsonResponse::notFound('Email template not found');
        }

        if ($this->name !== null) {
            $this->validate(['name' => 'string|max:100']);
        }

        if ($this->subject !== null) {
            $this->validate(['subject' => 'string|max:255']);
        }

        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $template->{$field};
        }

        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $template->{$field} = $this->{$field};
            }
        }

        $template->save();

        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $template->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'email_template',
            $template->id,
            $changes,
            ClientIp::from($this->request, true),
            $this->request->user['office_id'] ?? null,
        );

        return JsonResponse::ok($template->toArray());
    }

    private function findEditableTemplate(string $id): ?EmailTemplate
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;
        $userRole = $this->request->user['role'] ?? 'agent';

        $template = EmailTemplate::where('id', '=', $id)->first();

        if (!$template instanceof EmailTemplate) {
            return null;
        }

        if ($template->scope === 'office') {
            if ($template->office_id !== $officeId) {
                return null;
            }

            if (!in_array($userRole, ['admin', 'manager'])) {
                return null;
            }

            return $template;
        }

        if ($template->scope === 'personal' && $template->created_by_user_id === $userId) {
            return $template;
        }

        return null;
    }
}
