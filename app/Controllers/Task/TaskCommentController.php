<?php

namespace App\Controllers\Task;

use App\Models\Task;
use App\Models\TaskComment;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class TaskCommentController extends Controller
{
    public string $id = '';

    public string $body = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        // Verify task exists and belongs to office
        $task = Task::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$task instanceof Task) {
            return JsonResponse::notFound('Task not found');
        }

        $modelQuery = TaskComment::with(['user'])
            ->where('task_id', '=', $task->id)
            ->orderBy('created_at', 'ASC');

        [$modelQuery, $page, $perPage, $withTotal] = ControllerListHelpers::applyListParams(
            $modelQuery,
            $this->request,
            50,
        );

        $result = $modelQuery->paginate($page, $perPage, 50, true);

        return JsonResponse::paginated($result);
    }

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
                'body' => 'required|string',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $taskComment = new TaskComment();
        $taskComment->task_id = $task->id;
        $taskComment->user_id = $this->request->user['id'];
        $taskComment->body = $this->body;
        $taskComment->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'comment_added',
            'task',
            $task->id,
            [],
            ClientIp::from($this->request, true),
            $officeId,
        );

        CacheHelper::forget('task', $this->id);

        return JsonResponse::created($taskComment->toArray());
    }
}
