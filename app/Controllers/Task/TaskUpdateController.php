<?php

namespace App\Controllers\Task;

use App\Models\Task;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use App\Services\ProcessExecutionService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class TaskUpdateController extends Controller
{
    public string $id = '';

    public ?string $title = null;

    public ?string $description = null;

    public ?string $status = null;

    public ?string $priority = null;

    public ?string $type = null;

    public ?string $due_date = null;

    public ?string $estate_id = null;

    public ?string $contact_id = null;

    public ?int $position = null;

    private const array VALID_STATUSES = ['open', 'in_progress', 'done', 'cancelled'];

    private const array VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    private const array VALID_TYPES = ['task', 'follow_up', 'viewing', 'call', 'document_request', 'maintenance'];

    private const array PATCHABLE_FIELDS = [
        'title', 'description', 'status', 'priority', 'type',
        'due_date', 'estate_id', 'contact_id', 'position',
    ];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $task = Task::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$task instanceof Task) {
            return JsonResponse::notFound('Task not found');
        }

        // Validate enum fields if provided
        try {
            if ($this->status !== null) {
                $this->validate(['status' => 'string|in:' . implode(',', self::VALID_STATUSES)]);
            }

            if ($this->priority !== null) {
                $this->validate(['priority' => 'string|in:' . implode(',', self::VALID_PRIORITIES)]);
            }

            if ($this->type !== null) {
                $this->validate(['type' => 'string|in:' . implode(',', self::VALID_TYPES)]);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        // Snapshot old values for audit
        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $task->{$field};
        }

        // Apply non-null incoming values
        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $task->{$field} = $this->{$field};
            }
        }

        // Handle completed_at based on status changes
        if ($this->status !== null) {
            $isCompleting = in_array($this->status, ['done', 'cancelled'], true);
            $wasCompleted = in_array($oldData['status'], ['done', 'cancelled'], true);

            if ($isCompleting && !$wasCompleted) {
                $task->completed_at = date('Y-m-d H:i:s');
            } elseif (!$isCompleting && $wasCompleted) {
                $task->completed_at = null;
            }
        }

        $task->save();

        // Compute diff for audit
        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $task->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'task',
            $task->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        // Log activity for status changes
        if (isset($changes['status'])) {
            /** @var ActivityService $activityService */
            $activityService = $this->make(ActivityService::class);
            $activityService->log(
                type: 'task_status_changed',
                subject: 'Task status changed: ' . $task->title,
                userId: $this->request->user['id'],
                officeId: $officeId,
                taskId: $task->id,
                oldValue: (string) $changes['status']['old'],
                newValue: (string) $changes['status']['new'],
            );
        }

        // Advance process if this task is linked to a workflow step
        if (isset($changes['status']) && in_array($task->status, ['done', 'cancelled'], true)) {
            if ($task->process_step_instance_id !== null) {
                try {
                    /** @var ProcessExecutionService $processService */
                    $processService = $this->make(ProcessExecutionService::class);
                    $processService->onTaskCompleted($task);
                } catch (\Throwable) {
                    // Non-critical: don't fail the task update
                }
            }
        }

        CacheHelper::forget('task', $this->id);
        CacheHelper::forget('dashboard', $officeId ?? 'none');

        return JsonResponse::ok($task->toArray());
    }
}
