<?php

namespace App\Services;

use BaseApi\App;
use App\Models\ProcessInstance;
use App\Models\ProcessTemplate;

class ProcessTriggerService
{
    public function __construct(
        private readonly ProcessExecutionService $executionService,
    ) {}

    /**
     * Check if any process templates should be triggered by field changes.
     *
     * @param array<string, array{old: mixed, new: mixed}> $changes
     */
    public function checkTriggers(
        string $entityType,
        string $entityId,
        string $officeId,
        array $changes,
        string $userId,
    ): void {
        if ($changes === []) {
            return;
        }

        $templates = ProcessTemplate::where('office_id', '=', $officeId)
            ->where('entity_type', '=', $entityType)
            ->where('active', '=', true)
            ->get();

        foreach ($templates as $template) {
            if (!$template instanceof ProcessTemplate) {
                continue;
            }

            if (!$this->matchesTrigger($template, $changes)) {
                continue;
            }

            // Prevent duplicate: check if there's already a running instance for this template+entity
            $existing = ProcessInstance::where('process_template_id', '=', $template->id)
                ->where('entity_id', '=', $entityId)
                ->where('status', '=', 'running')
                ->exists();

            if ($existing) {
                continue;
            }

            try {
                $this->executionService->startInstance($template, $entityType, $entityId, $officeId, $userId);
            } catch (\Throwable $e) {
                App::logger()->error('process_trigger_start_failed', [
                    'template_id' => $template->id,
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * @param array<string, array{old: mixed, new: mixed}> $changes
     */
    private function matchesTrigger(ProcessTemplate $template, array $changes): bool
    {
        $triggerType = $template->trigger_type;
        $triggerConfig = $template->getTriggerConfig();

        return match ($triggerType) {
            'status_change' => $this->matchesStatusChange($triggerConfig, $changes),
            'field_change' => $this->matchesFieldChange($triggerConfig, $changes),
            default => false, // 'manual' and 'date_field' don't match on changes
        };
    }

    /**
     * @param array<string, array{old: mixed, new: mixed}> $changes
     */
    private function matchesStatusChange(array $triggerConfig, array $changes): bool
    {
        if (!isset($changes['status'])) {
            return false;
        }

        $fromStatus = $triggerConfig['from'] ?? null;
        $toStatus = $triggerConfig['to'] ?? null;

        $actualOld = (string) ($changes['status']['old'] ?? '');
        $actualNew = (string) ($changes['status']['new'] ?? '');

        if ($fromStatus !== null && $actualOld !== $fromStatus) {
            return false;
        }

        if ($toStatus !== null && $actualNew !== $toStatus) {
            return false;
        }

        return true;
    }

    /**
     * @param array<string, array{old: mixed, new: mixed}> $changes
     */
    private function matchesFieldChange(array $triggerConfig, array $changes): bool
    {
        $field = $triggerConfig['field'] ?? null;
        if ($field === null) {
            return false;
        }

        if (!isset($changes[$field])) {
            return false;
        }

        $toValue = $triggerConfig['to'] ?? null;
        if ($toValue !== null) {
            return (string) ($changes[$field]['new'] ?? '') === (string) $toValue;
        }

        return true;
    }
}
