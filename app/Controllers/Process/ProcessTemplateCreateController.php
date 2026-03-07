<?php

namespace App\Controllers\Process;

use App\Models\ProcessTemplate;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class ProcessTemplateCreateController extends Controller
{
    public string $name = '';

    public ?string $description = null;

    public string $entity_type = 'estate';

    public string $trigger_type = 'manual';

    public ?array $trigger_config = null;

    public ?array $steps = null;

    public bool $active = true;

    private const array VALID_ENTITY_TYPES = ['estate', 'contact'];

    private const array VALID_TRIGGER_TYPES = ['manual', 'status_change', 'field_change', 'date_field'];

    private const array VALID_STEP_TYPES = ['start', 'end', 'create_task', 'send_email', 'change_field', 'wait_days', 'decision', 'create_appointment'];

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'name' => 'required|string|max:255',
                'entity_type' => 'required|string|in:' . implode(',', self::VALID_ENTITY_TYPES),
                'trigger_type' => 'required|string|in:' . implode(',', self::VALID_TRIGGER_TYPES),
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        // Validate steps structure
        if ($this->steps !== null) {
            $stepErrors = $this->validateSteps($this->steps);
            if ($stepErrors !== []) {
                return JsonResponse::validationError(['steps' => $stepErrors]);
            }
        }

        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];

        $template = new ProcessTemplate();
        $template->name = $this->name;
        $template->description = $this->description;
        $template->entity_type = $this->entity_type;
        $template->trigger_type = $this->trigger_type;
        $template->active = $this->active;
        $template->office_id = $officeId;
        $template->created_by_user_id = $userId;

        if ($this->trigger_config !== null) {
            $template->setTriggerConfig($this->trigger_config);
        }

        if ($this->steps !== null) {
            $template->setSteps($this->steps);
        }

        $template->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'created',
            'process_template',
            $template->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'process_template_created',
            subject: 'Process template created: ' . $template->name,
            userId: $userId,
            officeId: $officeId,
        );

        return JsonResponse::created($template->toArray());
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
