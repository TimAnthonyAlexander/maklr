<?php

namespace App\Controllers\Task;

use App\Models\Task;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Support\ClientIp;

class TaskDeleteController extends Controller
{
    public string $id = '';

    public function delete(): Response
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $task = Task::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$task instanceof Task) {
            return JsonResponse::notFound('Task not found');
        }

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'task',
            $task->id,
            ['title' => ['old' => $task->title, 'new' => null]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'task_deleted',
            subject: 'Task deleted: ' . $task->title,
            userId: $this->request->user['id'],
            officeId: $officeId,
            taskId: $task->id,
        );

        $task->delete();

        CacheHelper::forget('task', $this->id);
        CacheHelper::forget('dashboard', $officeId ?? 'none');

        return JsonResponse::noContent();
    }
}
