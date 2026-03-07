<?php

namespace App\Services;

use BaseApi\App;
use App\Models\Appointment;
use App\Models\Contact;
use App\Models\Estate;
use App\Models\ProcessInstance;
use App\Models\ProcessStepInstance;
use App\Models\ProcessTemplate;
use App\Models\Task;
use App\Models\TaskUser;
use App\Models\User;

class ProcessExecutionService
{
    public function __construct(
        private readonly ActivityService $activityService,
    ) {}

    public function startInstance(
        ProcessTemplate $template,
        string $entityType,
        string $entityId,
        string $officeId,
        string $userId,
    ): ProcessInstance {
        $steps = $template->getSteps();

        $instance = new ProcessInstance();
        $instance->process_template_id = $template->id;
        $instance->entity_type = $entityType;
        $instance->entity_id = $entityId;
        $instance->status = 'running';
        $instance->started_at = date('Y-m-d H:i:s');
        $instance->started_by_user_id = $userId;
        $instance->office_id = $officeId;
        $instance->save();

        // Create step instances for all steps
        foreach ($steps as $stepDef) {
            $stepInstance = new ProcessStepInstance();
            $stepInstance->process_instance_id = $instance->id;
            $stepInstance->step_key = $stepDef['key'];
            $stepInstance->step_type = $stepDef['type'];
            $stepInstance->status = 'pending';
            $stepInstance->office_id = $officeId;
            $stepInstance->save();
        }

        // Find and activate the start step
        $startStep = $this->findStepByType($steps, 'start');
        if ($startStep !== null) {
            $instance->current_step_key = $startStep['key'];
            $instance->save();

            $startStepInstance = $this->findStepInstance($instance->id, $startStep['key']);
            if ($startStepInstance instanceof ProcessStepInstance) {
                $this->completeStep($startStepInstance);
                $this->advanceFromStep($instance, $startStep['key']);
            }
        }

        $this->activityService->log(
            type: 'process_started',
            subject: 'Process started: ' . $template->name,
            userId: $userId,
            officeId: $officeId,
            metadata: [
                'process_instance_id' => $instance->id,
                'process_template_id' => $template->id,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
            ],
        );

        return $instance;
    }

    public function advanceFromStep(ProcessInstance $instance, string $completedStepKey): void
    {
        $template = ProcessTemplate::find($instance->process_template_id);
        if (!$template instanceof ProcessTemplate) {
            return;
        }

        $stepDef = $template->getStepByKey($completedStepKey);
        if ($stepDef === null) {
            return;
        }

        // Determine next step key(s)
        $nextKeys = $this->getNextKeys($stepDef);

        foreach ($nextKeys as $nextKey) {
            if ($nextKey === null || $nextKey === '') {
                continue;
            }

            $nextStepDef = $template->getStepByKey($nextKey);
            if ($nextStepDef === null) {
                continue;
            }

            $nextStepInstance = $this->findStepInstance($instance->id, $nextKey);
            if (!$nextStepInstance instanceof ProcessStepInstance) {
                continue;
            }

            if ($nextStepDef['type'] === 'end') {
                $this->completeStep($nextStepInstance);
                $this->completeInstance($instance);

                return;
            }

            $this->activateStep($nextStepInstance);
            $instance->current_step_key = $nextKey;
            $instance->save();

            $this->executeStep($instance, $nextStepDef, $nextStepInstance);
        }
    }

    public function onTaskCompleted(Task $task): void
    {
        if ($task->process_step_instance_id === null) {
            return;
        }

        $stepInstance = ProcessStepInstance::find($task->process_step_instance_id);
        if (!$stepInstance instanceof ProcessStepInstance) {
            return;
        }

        if ($stepInstance->status !== 'active') {
            return;
        }

        $instance = ProcessInstance::find($stepInstance->process_instance_id);
        if (!$instance instanceof ProcessInstance) {
            return;
        }

        if ($instance->status !== 'running') {
            return;
        }

        $stepInstance->setResult(['task_id' => $task->id, 'task_status' => $task->status]);
        $this->completeStep($stepInstance);
        $this->advanceFromStep($instance, $stepInstance->step_key);
    }

    public function executeStep(
        ProcessInstance $instance,
        array $stepDef,
        ProcessStepInstance $stepInstance,
    ): void {
        try {
            match ($stepDef['type']) {
                'create_task' => $this->executeCreateTask($instance, $stepDef, $stepInstance),
                'send_email' => $this->executeSendEmail($instance, $stepDef, $stepInstance),
                'change_field' => $this->executeChangeField($instance, $stepDef, $stepInstance),
                'wait_days' => $this->executeWaitDays($instance, $stepDef, $stepInstance),
                'decision' => $this->executeDecision($instance, $stepDef, $stepInstance),
                'create_appointment' => $this->executeCreateAppointment($instance, $stepDef, $stepInstance),
                default => $this->failStep($stepInstance, 'Unknown step type: ' . $stepDef['type']),
            };
        } catch (\Throwable $e) {
            App::logger()->error('process_step_execution_failed', [
                'instance_id' => $instance->id,
                'step_key' => $stepDef['key'],
                'error' => $e->getMessage(),
            ]);
            $this->failStep($stepInstance, $e->getMessage());
        }
    }

    public function pauseInstance(ProcessInstance $instance): void
    {
        $instance->status = 'paused';
        $instance->save();
    }

    public function resumeInstance(ProcessInstance $instance): void
    {
        $instance->status = 'running';
        $instance->save();

        // Check if any active wait_days steps are past due
        $activeSteps = ProcessStepInstance::where('process_instance_id', '=', $instance->id)
            ->where('status', '=', 'active')
            ->get();

        foreach ($activeSteps as $step) {
            if ($step->step_type === 'wait_days' && $step->due_date !== null) {
                if ((strtotime($step->due_date) ?: 0) <= time()) {
                    $this->completeStep($step);
                    $this->advanceFromStep($instance, $step->step_key);
                }
            }
        }
    }

    public function cancelInstance(ProcessInstance $instance): void
    {
        $instance->status = 'cancelled';
        $instance->completed_at = date('Y-m-d H:i:s');
        $instance->save();

        // Mark all pending/active steps as skipped
        $pendingSteps = ProcessStepInstance::where('process_instance_id', '=', $instance->id)
            ->where('status', '=', 'pending')
            ->get();
        foreach ($pendingSteps as $step) {
            $step->status = 'skipped';
            $step->save();
        }

        $activeSteps = ProcessStepInstance::where('process_instance_id', '=', $instance->id)
            ->where('status', '=', 'active')
            ->get();
        foreach ($activeSteps as $step) {
            $step->status = 'skipped';
            $step->save();
        }
    }

    public function completeManualStep(ProcessInstance $instance, string $stepKey): bool
    {
        $stepInstance = $this->findStepInstance($instance->id, $stepKey);
        if (!$stepInstance instanceof ProcessStepInstance) {
            return false;
        }

        if ($stepInstance->status !== 'active') {
            return false;
        }

        $this->completeStep($stepInstance);
        $this->advanceFromStep($instance, $stepKey);

        return true;
    }

    public function processWaitSteps(): int
    {
        $dueSteps = ProcessStepInstance::where('status', '=', 'active')
            ->where('step_type', '=', 'wait_days')
            ->where('due_date', '<=', date('Y-m-d H:i:s'))
            ->get();

        $processed = 0;
        foreach ($dueSteps as $stepInstance) {
            $instance = ProcessInstance::find($stepInstance->process_instance_id);
            if (!$instance instanceof ProcessInstance || $instance->status !== 'running') {
                continue;
            }

            $this->completeStep($stepInstance);
            $this->advanceFromStep($instance, $stepInstance->step_key);
            $processed++;
        }

        return $processed;
    }

    public function resolvePlaceholders(string $text, ProcessInstance $instance): string
    {
        $entity = $this->loadEntity($instance);
        if ($entity === null) {
            return $text;
        }

        $entityData = $entity->toArray();
        $prefix = $instance->entity_type;

        foreach ($entityData as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                $text = str_replace('{{' . $prefix . '.' . $key . '}}', (string) $value, $text);
            }
        }

        // Remove any unresolved placeholders
        $text = (string) preg_replace('/\{\{[^}]+\}\}/', '', $text);

        return $text;
    }

    private function executeCreateTask(
        ProcessInstance $instance,
        array $stepDef,
        ProcessStepInstance $stepInstance,
    ): void {
        $config = $stepDef['config'] ?? [];
        $officeId = $instance->office_id;
        $userId = $this->resolveResponsible($instance, $stepDef);

        $maxNumber = Task::query()->qb()
            ->where('office_id', '=', $officeId)
            ->max('task_number');
        $taskNumber = (int) $maxNumber + 1;

        $task = new Task();
        $task->title = $this->resolvePlaceholders($config['title'] ?? 'Untitled Task', $instance);
        $task->description = isset($config['description'])
            ? $this->resolvePlaceholders($config['description'], $instance)
            : null;
        $task->priority = $config['priority'] ?? 'medium';
        $task->type = $config['task_type'] ?? 'task';
        $task->status = 'open';
        $task->office_id = $officeId;
        $task->created_by_user_id = $instance->started_by_user_id;
        $task->task_number = $taskNumber;
        $task->process_step_instance_id = $stepInstance->id;
        $task->estate_id = $instance->entity_type === 'estate' ? $instance->entity_id : null;
        $task->contact_id = $instance->entity_type === 'contact' ? $instance->entity_id : null;

        if (isset($stepDef['deadline_days'])) {
            $task->due_date = date('Y-m-d H:i:s', strtotime('+' . (int) $stepDef['deadline_days'] . ' days') ?: time());
        }

        $task->save();

        // Assign to user if resolved
        if ($userId !== null) {
            $taskUser = new TaskUser();
            $taskUser->task_id = $task->id;
            $taskUser->user_id = $userId;
            $taskUser->save();

            $stepInstance->assigned_user_id = $userId;
            $stepInstance->save();
        }

        $stepInstance->setResult(['task_id' => $task->id]);
        $stepInstance->save();

        // Task step stays active — completed when task is done
    }

    private function executeSendEmail(
        ProcessInstance $instance,
        array $stepDef,
        ProcessStepInstance $stepInstance,
    ): void {
        $config = $stepDef['config'] ?? [];

        $subject = $this->resolvePlaceholders($config['subject'] ?? '', $instance);
        $body = $this->resolvePlaceholders($config['body'] ?? '', $instance);

        $stepInstance->setResult([
            'email_subject' => $subject,
            'email_body_preview' => mb_substr($body, 0, 200),
            'status' => 'sent',
        ]);

        $this->completeStep($stepInstance);
        $this->advanceFromStep($instance, $stepInstance->step_key);
    }

    private function executeChangeField(
        ProcessInstance $instance,
        array $stepDef,
        ProcessStepInstance $stepInstance,
    ): void {
        $config = $stepDef['config'] ?? [];
        $field = $config['field'] ?? null;
        $value = $config['value'] ?? null;

        if ($field === null) {
            $this->failStep($stepInstance, 'No field specified');

            return;
        }

        $entity = $this->loadEntity($instance);
        if ($entity === null) {
            $this->failStep($stepInstance, 'Entity not found');

            return;
        }

        $oldValue = $entity->{$field} ?? null;
        $entity->{$field} = $value;
        $entity->save();

        $stepInstance->setResult(['field' => $field, 'old_value' => $oldValue, 'new_value' => $value]);
        $this->completeStep($stepInstance);
        $this->advanceFromStep($instance, $stepInstance->step_key);
    }

    private function executeWaitDays(
        ProcessInstance $instance,
        array $stepDef,
        ProcessStepInstance $stepInstance,
    ): void {
        $days = (int) ($stepDef['config']['days'] ?? $stepDef['deadline_days'] ?? 1);
        $stepInstance->due_date = date('Y-m-d H:i:s', strtotime('+' . $days . ' days') ?: time());
        $stepInstance->save();

        // Step stays active — processWaitSteps() job resolves it
    }

    private function executeDecision(
        ProcessInstance $instance,
        array $stepDef,
        ProcessStepInstance $stepInstance,
    ): void {
        $config = $stepDef['config'] ?? [];
        $mode = $config['mode'] ?? 'auto';

        if ($mode === 'manual') {
            // Manual decision — step stays active until manually completed
            return;
        }

        // Auto decision: evaluate field condition
        $fieldPath = $config['field'] ?? null;
        if ($fieldPath === null) {
            $this->failStep($stepInstance, 'No field specified for decision');

            return;
        }

        $actualValue = $this->resolveFieldValue($instance, $fieldPath);
        $operator = $config['operator'] ?? 'equals';
        $expectedValue = $config['value'] ?? null;

        $result = $this->evaluateCondition($actualValue, $operator, $expectedValue);

        $nextKey = $result ? ($stepDef['next_yes'] ?? null) : ($stepDef['next_no'] ?? null);
        $skippedKey = $result ? ($stepDef['next_no'] ?? null) : ($stepDef['next_yes'] ?? null);

        $stepInstance->setResult([
            'field' => $fieldPath,
            'operator' => $operator,
            'expected' => $expectedValue,
            'actual' => $actualValue,
            'result' => $result ? 'yes' : 'no',
        ]);

        // Skip the unchosen branch
        if ($skippedKey !== null && $skippedKey !== '') {
            $this->skipBranch($instance, $skippedKey);
        }

        $this->completeStep($stepInstance);

        if ($nextKey !== null && $nextKey !== '') {
            $template = ProcessTemplate::find($instance->process_template_id);
            if ($template instanceof ProcessTemplate) {
                $nextStepDef = $template->getStepByKey($nextKey);
                $nextStepInstance = $this->findStepInstance($instance->id, $nextKey);

                if ($nextStepDef !== null && $nextStepInstance instanceof ProcessStepInstance) {
                    if ($nextStepDef['type'] === 'end') {
                        $this->completeStep($nextStepInstance);
                        $this->completeInstance($instance);

                        return;
                    }

                    $this->activateStep($nextStepInstance);
                    $instance->current_step_key = $nextKey;
                    $instance->save();
                    $this->executeStep($instance, $nextStepDef, $nextStepInstance);
                }
            }
        }
    }

    private function executeCreateAppointment(
        ProcessInstance $instance,
        array $stepDef,
        ProcessStepInstance $stepInstance,
    ): void {
        $config = $stepDef['config'] ?? [];

        $appointment = new Appointment();
        $appointment->title = $this->resolvePlaceholders($config['title'] ?? 'Appointment', $instance);
        $appointment->description = isset($config['description'])
            ? $this->resolvePlaceholders($config['description'], $instance)
            : null;
        $appointment->type = $config['appointment_type'] ?? 'other';
        $appointment->office_id = $instance->office_id;
        $appointment->created_by_user_id = $instance->started_by_user_id;
        $appointment->estate_id = $instance->entity_type === 'estate' ? $instance->entity_id : null;

        if (isset($config['days_from_now'])) {
            $days = (int) $config['days_from_now'];
            $timestamp = strtotime('+' . $days . ' days') ?: time();
            $appointment->starts_at = date('Y-m-d 09:00:00', $timestamp);
            $appointment->ends_at = date('Y-m-d 10:00:00', $timestamp);
        }

        $appointment->save();

        $stepInstance->setResult(['appointment_id' => $appointment->id]);
        $this->completeStep($stepInstance);
        $this->advanceFromStep($instance, $stepInstance->step_key);
    }

    private function resolveResponsible(ProcessInstance $instance, array $stepDef): ?string
    {
        $responsible = $stepDef['responsible'] ?? $stepDef['config']['assign_to'] ?? null;

        return match ($responsible) {
            'trigger_user' => $instance->started_by_user_id,
            'assigned_user' => $this->getEntityAssignedUser($instance),
            default => $responsible,
        };
    }

    private function getEntityAssignedUser(ProcessInstance $instance): ?string
    {
        $entity = $this->loadEntity($instance);
        if ($entity === null) {
            return null;
        }

        return $entity->assigned_user_id ?? null;
    }

    private function loadEntity(ProcessInstance $instance): Estate|Contact|null
    {
        return match ($instance->entity_type) {
            'estate' => Estate::find($instance->entity_id),
            'contact' => Contact::find($instance->entity_id),
            default => null,
        };
    }

    private function resolveFieldValue(ProcessInstance $instance, string $fieldPath): mixed
    {
        // fieldPath format: "estate.status" or "contact.stage"
        $parts = explode('.', $fieldPath, 2);
        if (count($parts) !== 2) {
            return null;
        }

        $entity = $this->loadEntity($instance);
        if ($entity === null) {
            return null;
        }

        $field = $parts[1];

        return $entity->{$field} ?? null;
    }

    private function evaluateCondition(mixed $actual, string $operator, mixed $expected): bool
    {
        return match ($operator) {
            'equals' => (string) $actual === (string) $expected,
            'not_equals' => (string) $actual !== (string) $expected,
            'contains' => is_string($actual) && is_string($expected) && str_contains($actual, $expected),
            'greater_than' => is_numeric($actual) && is_numeric($expected) && $actual > $expected,
            'less_than' => is_numeric($actual) && is_numeric($expected) && $actual < $expected,
            'is_empty' => $actual === null || $actual === '',
            'is_not_empty' => $actual !== null && $actual !== '',
            default => false,
        };
    }

    private function skipBranch(ProcessInstance $instance, string $startKey): void
    {
        $template = ProcessTemplate::find($instance->process_template_id);
        if (!$template instanceof ProcessTemplate) {
            return;
        }

        $stepDef = $template->getStepByKey($startKey);
        if ($stepDef === null) {
            return;
        }

        $stepInstance = $this->findStepInstance($instance->id, $startKey);
        if ($stepInstance instanceof ProcessStepInstance && $stepInstance->status === 'pending') {
            $stepInstance->status = 'skipped';
            $stepInstance->save();
        }
    }

    private function findStepByType(array $steps, string $type): ?array
    {
        foreach ($steps as $step) {
            if (($step['type'] ?? '') === $type) {
                return $step;
            }
        }

        return null;
    }

    private function findStepInstance(string $instanceId, string $stepKey): ?ProcessStepInstance
    {
        return ProcessStepInstance::where('process_instance_id', '=', $instanceId)
            ->where('step_key', '=', $stepKey)
            ->first();
    }

    private function activateStep(ProcessStepInstance $stepInstance): void
    {
        $stepInstance->status = 'active';
        $stepInstance->activated_at = date('Y-m-d H:i:s');
        $stepInstance->save();
    }

    private function completeStep(ProcessStepInstance $stepInstance): void
    {
        $stepInstance->status = 'completed';
        $stepInstance->completed_at = date('Y-m-d H:i:s');
        $stepInstance->save();
    }

    private function failStep(ProcessStepInstance $stepInstance, string $error): void
    {
        $stepInstance->status = 'failed';
        $stepInstance->setResult(['error' => $error]);
        $stepInstance->completed_at = date('Y-m-d H:i:s');
        $stepInstance->save();

        // Fail the parent instance
        $instance = ProcessInstance::find($stepInstance->process_instance_id);
        if ($instance instanceof ProcessInstance) {
            $instance->status = 'failed';
            $instance->completed_at = date('Y-m-d H:i:s');
            $instance->save();
        }
    }

    private function completeInstance(ProcessInstance $instance): void
    {
        $instance->status = 'completed';
        $instance->completed_at = date('Y-m-d H:i:s');
        $instance->save();
    }

    private function getNextKeys(array $stepDef): array
    {
        $keys = [];

        if (isset($stepDef['next'])) {
            $keys[] = $stepDef['next'];
        }

        // Decision steps use next_yes/next_no — handled in executeDecision

        return $keys;
    }
}
