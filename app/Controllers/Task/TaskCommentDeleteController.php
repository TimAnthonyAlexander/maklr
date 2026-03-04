<?php

namespace App\Controllers\Task;

use App\Models\Task;
use App\Models\TaskComment;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Support\ClientIp;

class TaskCommentDeleteController extends Controller
{
    public string $id = '';

    public string $commentId = '';

    public function delete(): Response
    {
        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];
        $userRole = $this->request->user['role'] ?? 'agent';

        // Verify task exists and belongs to office
        $task = Task::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$task instanceof Task) {
            return JsonResponse::notFound('Task not found');
        }

        $comment = TaskComment::where('id', '=', $this->commentId)
            ->where('task_id', '=', $task->id)
            ->first();

        if (!$comment instanceof TaskComment) {
            return JsonResponse::notFound('Comment not found');
        }

        // Only comment author or manager+ can delete
        $isAuthor = $comment->user_id === $userId;
        $isManagerOrAbove = in_array($userRole, ['manager', 'admin'], true);

        if (!$isAuthor && !$isManagerOrAbove) {
            return JsonResponse::forbidden('Only the comment author or a manager can delete comments');
        }

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $userId,
            'comment_deleted',
            'task',
            $task->id,
            ['comment_id' => ['old' => $comment->id, 'new' => null]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        $comment->delete();

        CacheHelper::forget('task', $this->id);

        return JsonResponse::noContent();
    }
}
