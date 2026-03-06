<?php

namespace App\Controllers\CustomField;

use App\Models\CustomFieldDefinition;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Support\ClientIp;

class CustomFieldDefinitionDeleteController extends Controller
{
    public string $id = '';

    public function delete(): Response
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $definition = CustomFieldDefinition::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$definition instanceof CustomFieldDefinition) {
            return JsonResponse::notFound('Custom field definition not found');
        }

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'custom_field_definition',
            $definition->id,
            ['name' => ['old' => $definition->name, 'new' => null]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        $definition->delete();

        return JsonResponse::noContent();
    }
}
