<?php

namespace App\Models;

use Override;
use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class ProcessTemplate extends BaseModel
{
    public string $name = '';

    public ?string $description = null;

    public string $entity_type = 'estate';

    public string $trigger_type = 'manual';

    public ?string $trigger_config = null;

    public ?string $steps = null;

    public bool $active = true;

    public ?string $office_id = null;

    public ?string $created_by_user_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'description' => ['type' => 'TEXT', 'nullable' => true],
        'entity_type' => ['type' => 'VARCHAR(20)'],
        'trigger_type' => ['type' => 'VARCHAR(30)'],
        'trigger_config' => ['type' => 'JSON', 'nullable' => true],
        'steps' => ['type' => 'JSON', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'office_id' => 'index',
        'created_by_user_id' => 'index',
        ['office_id', 'active'],
        ['office_id', 'entity_type', 'trigger_type'],
    ];

    public function getTriggerConfig(): array
    {
        if ($this->trigger_config === null || $this->trigger_config === '') {
            return [];
        }

        return json_decode($this->trigger_config, true) ?: [];
    }

    public function setTriggerConfig(array $config): void
    {
        $this->trigger_config = $config === [] ? null : (json_encode($config) ?: null);
    }

    public function getSteps(): array
    {
        if ($this->steps === null || $this->steps === '') {
            return [];
        }

        return json_decode($this->steps, true) ?: [];
    }

    public function setSteps(array $steps): void
    {
        $this->steps = $steps === [] ? null : (json_encode($steps) ?: null);
    }

    public function getStepByKey(string $key): ?array
    {
        foreach ($this->getSteps() as $step) {
            if (($step['key'] ?? '') === $key) {
                return $step;
            }
        }

        return null;
    }

    #[Override]
    public function toArray(bool $includeRelations = false): array
    {
        $data = parent::toArray($includeRelations);
        $data['trigger_config'] = $this->getTriggerConfig();
        $data['steps'] = $this->getSteps();

        return $data;
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function instances(): HasMany
    {
        return $this->hasMany(ProcessInstance::class, 'process_template_id');
    }
}
