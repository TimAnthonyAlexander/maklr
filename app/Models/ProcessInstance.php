<?php

namespace App\Models;

use Override;
use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class ProcessInstance extends BaseModel
{
    public ?string $process_template_id = null;

    public string $entity_type = 'estate';

    public ?string $entity_id = null;

    public string $status = 'running';

    public ?string $current_step_key = null;

    public ?string $started_at = null;

    public ?string $completed_at = null;

    public ?string $started_by_user_id = null;

    public ?string $office_id = null;

    public ?string $context_data = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'entity_type' => ['type' => 'VARCHAR(20)'],
        'status' => ['type' => 'VARCHAR(20)'],
        'current_step_key' => ['type' => 'VARCHAR(100)', 'nullable' => true],
        'started_at' => ['type' => 'DATETIME', 'nullable' => true],
        'completed_at' => ['type' => 'DATETIME', 'nullable' => true],
        'context_data' => ['type' => 'JSON', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'process_template_id' => 'index',
        'office_id' => 'index',
        'started_by_user_id' => 'index',
        ['office_id', 'status'],
        ['entity_type', 'entity_id'],
    ];

    public function getContextData(): array
    {
        if ($this->context_data === null || $this->context_data === '') {
            return [];
        }

        return json_decode($this->context_data, true) ?: [];
    }

    public function setContextData(array $data): void
    {
        $this->context_data = $data === [] ? null : (json_encode($data) ?: null);
    }

    #[Override]
    public function toArray(bool $includeRelations = false): array
    {
        $data = parent::toArray($includeRelations);
        $data['context_data'] = $this->getContextData();

        return $data;
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ProcessTemplate::class, 'process_template_id');
    }

    public function startedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by_user_id');
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function stepInstances(): HasMany
    {
        return $this->hasMany(ProcessStepInstance::class);
    }
}
