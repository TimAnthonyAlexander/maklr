<?php

namespace App\Services;

use App\Models\AuditLog;
use Throwable;
use BaseApi\Logger;

class AuditLogService
{
    public function __construct(
        private readonly Logger $logger,
    ) {}

    /**
     * Log an audit event. Soft-fails: never throws, logs errors instead.
     *
     * @param string $userId The ID of the user performing the action
     * @param string $action The action performed (e.g. 'created', 'updated', 'deleted')
     * @param string $entityType The type of entity (e.g. 'office', 'user')
     * @param string $entityId The ID of the entity
     * @param array<string, array{old: mixed, new: mixed}> $changes Changed fields
     * @param string|null $ipAddress The IP address of the request
     * @param string|null $officeId The office ID for scoping
     */
    public function log(
        string $userId,
        string $action,
        string $entityType,
        string $entityId,
        array $changes = [],
        ?string $ipAddress = null,
        ?string $officeId = null,
    ): void {
        try {
            $this->logger->info('audit', [
                'user_id' => $userId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'changes' => $changes,
                'ip_address' => $ipAddress,
            ]);

            $auditLog = new AuditLog();
            $auditLog->user_id = $userId;
            $auditLog->action = $action;
            $auditLog->entity_type = $entityType;
            $auditLog->entity_id = $entityId;
            $auditLog->setChanges($changes);
            $auditLog->ip_address = $ipAddress;
            $auditLog->office_id = $officeId;
            $auditLog->save();
        } catch (Throwable $throwable) {
            try {
                $this->logger->error('audit_log_failed', [
                    'error' => $throwable->getMessage(),
                    'action' => $action,
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                ]);
            } catch (Throwable) {
                // Silently fail — audit logging must never break the request
            }
        }
    }

    /**
     * Compute changes between old and new data for tracked fields.
     *
     * @param array<string, mixed> $oldData
     * @param array<string, mixed> $newData
     * @param array<string> $trackedFields Fields to compare
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public static function computeChanges(array $oldData, array $newData, array $trackedFields): array
    {
        $changes = [];

        foreach ($trackedFields as $trackedField) {
            $oldValue = $oldData[$trackedField] ?? null;
            $newValue = $newData[$trackedField] ?? null;

            if ($oldValue !== $newValue) {
                $changes[$trackedField] = ['old' => $oldValue, 'new' => $newValue];
            }
        }

        return $changes;
    }
}
