<?php

namespace App\Controllers\Email;

use App\Models\Email;
use App\Models\EmailAccount;
use App\Models\Task;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

class EmailCreateTaskController extends Controller
{
    public string $id = '';

    public function post(): JsonResponse
    {
        $email = Email::find($this->id);

        if (!$email instanceof Email) {
            return JsonResponse::notFound('Email not found');
        }

        if (!$this->isAccountAccessible($email->email_account_id)) {
            return JsonResponse::notFound('Email not found');
        }

        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        // Generate task_number: MAX + 1 within office
        $maxNumber = Task::query()->qb()
            ->where('office_id', '=', $officeId)
            ->max('task_number');
        $taskNumber = (int) $maxNumber + 1;

        // Build description from email body
        $bodyText = $email->body_text ?? '';
        if ($bodyText === '' && $email->body_html !== null) {
            $bodyText = strip_tags($email->body_html);
        }

        $description = mb_strlen($bodyText) > 1000
            ? mb_substr($bodyText, 0, 1000) . '...'
            : $bodyText;

        $task = new Task();
        $task->title = $email->subject ?: 'Task from email';
        $task->description = $description ?: null;
        $task->status = 'open';
        $task->priority = 'medium';
        $task->type = 'follow_up';
        $task->estate_id = $email->estate_id;
        $task->contact_id = $email->contact_id;
        $task->office_id = $officeId;
        $task->created_by_user_id = $userId;
        $task->task_number = $taskNumber;
        $task->save();

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
            type: 'task_created_from_email',
            subject: 'Task created from email: ' . $task->title,
            userId: $userId,
            officeId: $officeId,
            taskId: $task->id,
            emailId: $email->id,
            estateId: $task->estate_id,
            contactId: $task->contact_id,
        );

        CacheHelper::forget('dashboard', $officeId ?? 'none');

        return JsonResponse::created($task->toArray());
    }

    private function isAccountAccessible(string $accountId): bool
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        $account = EmailAccount::where('id', '=', $accountId)
            ->where('user_id', '=', $userId)
            ->where('scope', '=', 'personal')
            ->first();

        if ($account instanceof EmailAccount) {
            return true;
        }

        if ($officeId !== null) {
            $account = EmailAccount::where('id', '=', $accountId)
                ->where('office_id', '=', $officeId)
                ->where('scope', '=', 'office')
                ->first();

            if ($account instanceof EmailAccount) {
                return true;
            }
        }

        return false;
    }
}
