<?php

namespace App\Models;

use Override;
use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class ProcessStepInstance extends BaseModel
{
    public ?string $process_instance_id = null;

    public string $step_key = '';

    public string $step_type = '';

    public string $status = 'pending';

    public ?string $result = null;

    public ?string $assigned_user_id = null;

    public ?string $activated_at = null;

    public ?string $completed_at = null;

    public ?string $due_date = null;

    public ?string $office_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'step_key' => ['type' => 'VARCHAR(100)'],
        'step_type' => ['type' => 'VARCHAR(30)'],
        'status' => ['type' => 'VARCHAR(20)'],
        'result' => ['type' => 'JSON', 'nullable' => true],
        'activated_at' => ['type' => 'DATETIME', 'nullable' => true],
        'completed_at' => ['type' => 'DATETIME', 'nullable' => true],
        'due_date' => ['type' => 'DATETIME', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'process_instance_id' => 'index',
        'assigned_user_id' => 'index',
        'office_id' => 'index',
        ['process_instance_id', 'step_key', 'type' => 'unique'],
        ['status', 'due_date'],
    ];

    public function getResult(): array
    {
        if ($this->result === null || $this->result === '') {
            return [];
        }

        return json_decode($this->result, true) ?: [];
    }

    public function setResult(array $data): void
    {
        $this->result = $data === [] ? null : (json_encode($data) ?: null);
    }

    #[Override]
    public function toArray(bool $includeRelations = false): array
    {
        $data = parent::toArray($includeRelations);
        $data['result'] = $this->getResult();

        return $data;
    }

    public function processInstance(): BelongsTo
    {
        return $this->belongsTo(ProcessInstance::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
