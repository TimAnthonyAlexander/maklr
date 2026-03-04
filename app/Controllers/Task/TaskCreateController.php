<?php

namespace App\Controllers\Task;

use App\Models\Task;
use App\Models\TaskUser;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class TaskCreateController extends Controller
{
    public string $title = '';

    public ?string $description = null;

    public string $status = 'open';

    public string $priority = 'medium';

    public string $type = 'task';

    public ?string $due_date = null;

    public ?string $estate_id = null;

    public ?string $contact_id = null;

    public ?int $position = null;

    /** @var array<string> */
    public array $assignee_ids = [];

    private const array VALID_STATUSES = ['open', 'in_progress', 'done', 'cancelled'];

    private const array VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    private const array VALID_TYPES = ['task', 'follow_up', 'viewing', 'call', 'document_request', 'maintenance'];

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'title' => 'required|string|max:255',
                'status' => 'string|in:' . implode(',', self::VALID_STATUSES),
                'priority' => 'string|in:' . implode(',', self::VALID_PRIORITIES),
                'type' => 'string|in:' . implode(',', self::VALID_TYPES),
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];

        // Generate task_number: MAX + 1 within office
        $maxNumber = Task::query()->qb()
            ->where('office_id', '=', $officeId)
            ->max('task_number');
        $taskNumber = (int) $maxNumber + 1;

        $task = new Task();
        $task->title = $this->title;
        $task->description = $this->description;
        $task->status = $this->status;
        $task->priority = $this->priority;
        $task->type = $this->type;
        $task->due_date = $this->due_date;
        $task->estate_id = $this->estate_id;
        $task->contact_id = $this->contact_id;
        $task->position = $this->position;
        $task->office_id = $officeId;
        $task->created_by_user_id = $userId;
        $task->task_number = $taskNumber;

        // Set completed_at if created as done/cancelled
        if (in_array($this->status, ['done', 'cancelled'], true)) {
            $task->completed_at = date('Y-m-d H:i:s');
        }

        $task->save();

        // Create assignee records
        foreach ($this->assignee_ids as $assignee_id) {
            $taskUser = new TaskUser();
            $taskUser->task_id = $task->id;
            $taskUser->user_id = $assignee_id;
            $taskUser->save();
        }

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'created',
            'task',
            $task->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'task_created',
            subject: 'Task created: ' . $task->title,
            userId: $userId,
            officeId: $officeId,
            taskId: $task->id,
            estateId: $task->estate_id,
            contactId: $task->contact_id,
        );

        // Re-fetch with relations for response
        $task = Task::with(['taskUsers'])->where('id', '=', $task->id)->first();

        CacheHelper::forget('dashboard', $officeId ?? 'none');

        return JsonResponse::created($task instanceof Task ? $task->toArray(true) : []);
    }
}
