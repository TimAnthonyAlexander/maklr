<?php

namespace App\Controllers\Process;

use App\Models\ProcessTemplate;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class ProcessTemplateUpdateController extends Controller
{
    public string $id = '';

    public ?string $name = null;

    public ?string $description = null;

    public ?string $entity_type = null;

    public ?string $trigger_type = null;

    public ?array $trigger_config = null;

    public ?array $steps = null;

    public ?bool $active = null;

    private const array VALID_ENTITY_TYPES = ['estate', 'contact'];

    private const array VALID_TRIGGER_TYPES = ['manual', 'status_change', 'field_change', 'date_field'];

    private const array VALID_STEP_TYPES = ['start', 'end', 'create_task', 'send_email', 'change_field', 'wait_days', 'decision', 'create_appointment'];

    private const array PATCHABLE_FIELDS = ['name', 'description', 'entity_type', 'trigger_type', 'active'];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $template = ProcessTemplate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$template instanceof ProcessTemplate) {
            return JsonResponse::notFound('Process template not found');
        }

        try {
            if ($this->entity_type !== null) {
                $this->validate(['entity_type' => 'string|in:' . implode(',', self::VALID_ENTITY_TYPES)]);
            }

            if ($this->trigger_type !== null) {
                $this->validate(['trigger_type' => 'string|in:' . implode(',', self::VALID_TRIGGER_TYPES)]);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        // Validate steps if provided
        if ($this->steps !== null) {
            $stepErrors = $this->validateSteps($this->steps);
            if ($stepErrors !== []) {
                return JsonResponse::validationError(['steps' => $stepErrors]);
            }
        }

        // Snapshot for audit
        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $template->{$field};
        }

        // Apply scalar fields
        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $template->{$field} = $this->{$field};
            }
        }

        if ($this->trigger_config !== null) {
            $template->setTriggerConfig($this->trigger_config);
        }

        if ($this->steps !== null) {
            $template->setSteps($this->steps);
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
            'process_template',
            $template->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::ok($template->toArray());
    }

    /**
     * @return array<string>
     */
    private function validateSteps(array $steps): array
    {
        $errors = [];
        $keys = [];

        foreach ($steps as $index => $step) {
            if (!isset($step['key']) || $step['key'] === '') {
                $errors[] = "Step {$index}: missing key";
            } else {
                if (in_array($step['key'], $keys, true)) {
                    $errors[] = "Step {$index}: duplicate key '{$step['key']}'";
                }
                $keys[] = $step['key'];
            }

            if (!isset($step['type']) || !in_array($step['type'], self::VALID_STEP_TYPES, true)) {
                $errors[] = "Step {$index}: invalid type";
            }
        }

        return $errors;
    }
}
