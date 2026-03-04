<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class AuditLog extends BaseModel
{
    public string $user_id = '';

    public string $action = '';

    public string $entity_type = '';

    public string $entity_id = '';

    public ?string $field_name = null;

    public ?string $old_value = null;

    public ?string $new_value = null;

    public ?string $ip_address = null;

    public ?string $office_id = null;

    public ?string $changes = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'action' => ['type' => 'VARCHAR(20)'],
        'entity_type' => ['type' => 'VARCHAR(100)'],
        'old_value' => ['type' => 'TEXT', 'nullable' => true],
        'new_value' => ['type' => 'TEXT', 'nullable' => true],
        'ip_address' => ['type' => 'VARCHAR(45)', 'nullable' => true],
        'office_id' => ['nullable' => true],
        'changes' => ['type' => 'JSON', 'nullable' => true],
    ];

    /**
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public function getChanges(): array
    {
        if ($this->changes === null || $this->changes === '') {
            return [];
        }

        return json_decode($this->changes, true) ?: [];
    }

    /**
     * @param array<string, array{old: mixed, new: mixed}> $changes
     */
    public function setChanges(array $changes): void
    {
        $this->changes = $changes !== [] ? (json_encode($changes) ?: null) : null;
    }

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'user_id' => 'index',
        'action' => 'index',
        'office_id' => 'index',
        ['entity_type', 'entity_id', 'created_at'],
        ['user_id', 'created_at'],
        ['office_id', 'created_at'],
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
