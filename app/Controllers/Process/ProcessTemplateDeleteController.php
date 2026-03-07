<?php

namespace App\Controllers\Process;

use App\Models\ProcessTemplate;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Support\ClientIp;

class ProcessTemplateDeleteController extends Controller
{
    public string $id = '';

    public function delete(): Response
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $template = ProcessTemplate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$template instanceof ProcessTemplate) {
            return JsonResponse::notFound('Process template not found');
        }

        // Soft-deactivate instead of hard delete
        $template->active = false;
        $template->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'process_template',
            $template->id,
            ['active' => ['old' => true, 'new' => false]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::noContent();
    }
}
