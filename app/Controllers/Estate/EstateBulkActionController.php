<?php

namespace App\Controllers\Estate;

use Throwable;
use App\Models\Estate;
use App\Models\User;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class EstateBulkActionController extends Controller
{
    /** @var string[] */
    public array $ids = [];

    public string $action = '';

    public ?string $status = null;

    public ?string $assigned_user_id = null;

    private const array VALID_STATUSES = ['draft', 'active', 'reserved', 'sold', 'rented', 'archived'];

    private const int MAX_IDS = 100;

    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly ActivityService $activityService,
    ) {}

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'action' => 'required|string|in:status_change,assign,archive',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        if (!is_array($this->ids) || $this->ids === []) {
            return JsonResponse::validationError(['ids' => ['ids is required and must be a non-empty array']]);
        }

        if (count($this->ids) > self::MAX_IDS) {
            return JsonResponse::validationError(['ids' => ['Maximum ' . self::MAX_IDS . ' estates per bulk action']]);
        }

        if ($this->action === 'status_change') {
            try {
                $this->validate([
                    'status' => 'required|string|in:' . implode(',', self::VALID_STATUSES),
                ]);
            } catch (ValidationException $e) {
                return JsonResponse::validationError($e->errors());
            }
        }

        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'] ?? null;
        $ip = ClientIp::from($this->request, true);

        $estates = Estate::where('office_id', '=', $officeId)
            ->whereIn('id', $this->ids)
            ->get();

        if ($this->action === 'assign' && $this->assigned_user_id !== null) {
            $targetUser = User::where('id', '=', $this->assigned_user_id)
                ->where('office_id', '=', $officeId)
                ->first();

            if (!$targetUser instanceof User) {
                return JsonResponse::validationError(['assigned_user_id' => ['User not found in your office']]);
            }
        }

        $updated = 0;
        $skipped = 0;
        $errors = [];

        foreach ($estates as $estate) {
            /** @var Estate $estate */
            try {
                $result = match ($this->action) {
                    'status_change' => $this->applyStatusChange($estate, $userId, $officeId, $ip),
                    'assign' => $this->applyAssign($estate, $userId, $officeId, $ip),
                    'archive' => $this->applyArchive($estate, $userId, $officeId, $ip),
                    default => 'skipped',
                };

                if ($result === 'updated') {
                    $updated++;
                } else {
                    $skipped++;
                }
            } catch (Throwable $e) {
                $errors[] = 'Estate ' . ($estate->title ?: $estate->id) . ': ' . $e->getMessage();
            }
        }

        $notFound = count($this->ids) - count($estates);
        $skipped += $notFound;

        CacheHelper::forget('dashboard', $officeId ?? 'none');

        return JsonResponse::ok([
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    private function applyStatusChange(Estate $estate, ?string $userId, ?string $officeId, string $ip): string
    {
        $oldStatus = $estate->status;

        if ($oldStatus === $this->status) {
            return 'skipped';
        }

        $estate->status = $this->status;
        $estate->save();

        $changes = AuditLogService::computeChanges(
            ['status' => $oldStatus],
            ['status' => $this->status],
            ['status'],
        );

        $this->auditLogService->log($userId, 'updated', 'estate', $estate->id, $changes, $ip, $officeId);

        $this->activityService->log(
            type: 'estate_status_changed',
            subject: 'Estate status changed: ' . $estate->title,
            userId: $userId,
            officeId: $officeId,
            estateId: $estate->id,
            oldValue: $oldStatus,
            newValue: (string) $this->status,
        );

        return 'updated';
    }

    private function applyAssign(Estate $estate, ?string $userId, ?string $officeId, string $ip): string
    {
        $oldAssignedUserId = $estate->assigned_user_id;

        if ($oldAssignedUserId === $this->assigned_user_id) {
            return 'skipped';
        }

        $estate->assigned_user_id = $this->assigned_user_id;
        $estate->save();

        $changes = AuditLogService::computeChanges(
            ['assigned_user_id' => $oldAssignedUserId],
            ['assigned_user_id' => $this->assigned_user_id],
            ['assigned_user_id'],
        );

        $this->auditLogService->log($userId, 'updated', 'estate', $estate->id, $changes, $ip, $officeId);

        return 'updated';
    }

    private function applyArchive(Estate $estate, ?string $userId, ?string $officeId, string $ip): string
    {
        if ($estate->status === 'archived') {
            return 'skipped';
        }

        $oldStatus = $estate->status;
        $estate->status = 'archived';
        $estate->save();

        $this->auditLogService->log(
            $userId,
            'deleted',
            'estate',
            $estate->id,
            ['status' => ['old' => $oldStatus, 'new' => 'archived']],
            $ip,
            $officeId,
        );

        $this->activityService->log(
            type: 'estate_deleted',
            subject: 'Estate deleted: ' . $estate->title,
            userId: $userId,
            officeId: $officeId,
            estateId: $estate->id,
        );

        return 'updated';
    }
}
