<?php

namespace App\Controllers\Task;

use App\Models\Task;
use App\Models\TaskUser;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class TaskAssigneeController extends Controller
{
    public string $id = '';

    /** @var array<string> */
    public array $user_ids = [];

    public string $user_id = '';

    public function post(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $task = Task::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$task instanceof Task) {
            return JsonResponse::notFound('Task not found');
        }

        try {
            $this->validate([
                'user_ids' => 'required',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $addedIds = [];

        foreach ($this->user_ids as $user_id) {
            // Validate user exists and belongs to same office
            $user = User::where('id', '=', $user_id)
                ->where('office_id', '=', $officeId)
                ->first();

            if (!$user instanceof User) {
                continue;
            }

            // Skip if already assigned
            $existing = TaskUser::where('task_id', '=', $task->id)
                ->where('user_id', '=', $user_id)
                ->exists();

            if ($existing) {
                continue;
            }

            $taskUser = new TaskUser();
            $taskUser->task_id = $task->id;
            $taskUser->user_id = $user_id;
            $taskUser->save();

            $addedIds[] = $user_id;
        }

        if ($addedIds !== []) {
            /** @var AuditLogService $auditLog */
            $auditLog = $this->make(AuditLogService::class);
            $auditLog->log(
                $this->request->user['id'],
                'assignees_added',
                'task',
                $task->id,
                ['user_ids' => ['old' => null, 'new' => $addedIds]],
                ClientIp::from($this->request, true),
                $officeId,
            );
        }

        CacheHelper::forget('task', $this->id);

        // Re-fetch with relations
        $task = Task::with(['taskUsers'])->where('id', '=', $task->id)->first();

        return JsonResponse::ok($task instanceof Task ? $task->toArray(true) : []);
    }

    public function delete(): Response
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $task = Task::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$task instanceof Task) {
            return JsonResponse::notFound('Task not found');
        }

        if ($this->user_id === '') {
            return JsonResponse::badRequest('user_id is required');
        }

        $taskUser = TaskUser::where('task_id', '=', $task->id)
            ->where('user_id', '=', $this->user_id)
            ->first();

        if (!$taskUser instanceof TaskUser) {
            return JsonResponse::notFound('Assignee not found');
        }

        $taskUser->delete();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'assignee_removed',
            'task',
            $task->id,
            ['user_id' => ['old' => $this->user_id, 'new' => null]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        CacheHelper::forget('task', $this->id);

        return JsonResponse::noContent();
    }
}
