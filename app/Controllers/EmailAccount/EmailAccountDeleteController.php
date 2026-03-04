<?php

namespace App\Controllers\EmailAccount;

use App\Models\EmailAccount;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;

class EmailAccountDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $account = $this->findWritableAccount($this->id);

        if (!$account instanceof EmailAccount) {
            return JsonResponse::notFound('Email account not found');
        }

        $emailAddress = $account->email_address;
        $officeId = $account->office_id;

        $account->active = false;
        $account->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'email_account',
            $account->id,
            ['active' => ['old' => true, 'new' => false]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'email_account_deleted',
            subject: 'Email account disconnected: ' . $emailAddress,
            userId: $this->request->user['id'],
            officeId: $officeId,
        );

        CacheHelper::forget('email_accounts', $this->request->user['id']);

        return JsonResponse::ok(['message' => 'Email account deactivated']);
    }

    private function findWritableAccount(string $id): ?EmailAccount
    {
        $userId = $this->request->user['id'];
        $userRole = $this->request->user['role'] ?? '';
        $officeId = $this->request->user['office_id'] ?? null;

        // Personal: only owner
        $account = EmailAccount::where('id', '=', $id)
            ->where('user_id', '=', $userId)
            ->where('scope', '=', 'personal')
            ->first();

        if ($account instanceof EmailAccount) {
            return $account;
        }

        // Office: only admin/manager in same office
        if ($officeId !== null && in_array($userRole, ['admin', 'manager'])) {
            $account = EmailAccount::where('id', '=', $id)
                ->where('office_id', '=', $officeId)
                ->where('scope', '=', 'office')
                ->first();

            if ($account instanceof EmailAccount) {
                return $account;
            }
        }

        return null;
    }
}
