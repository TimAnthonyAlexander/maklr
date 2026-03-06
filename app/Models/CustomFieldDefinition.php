<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class CustomFieldDefinition extends BaseModel
{
    public string $name = '';

    public string $label = '';

    public string $field_type = 'text';

    public string $entity_type = 'estate';

    public ?string $options = null;

    public bool $required = false;

    public int $sort_order = 0;

    public bool $active = true;

    public ?string $office_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'name' => ['type' => 'VARCHAR(100)'],
        'label' => ['type' => 'VARCHAR(255)'],
        'field_type' => ['type' => 'VARCHAR(20)'],
        'entity_type' => ['type' => 'VARCHAR(20)'],
        'options' => ['type' => 'JSON', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        ['office_id', 'name', 'type' => 'unique'],
        'entity_type' => 'index',
        'office_id' => 'index',
        'active' => 'index',
    ];

    public function getOptions(): array
    {
        if ($this->options === null || $this->options === '') {
            return [];
        }

        return json_decode($this->options, true) ?: [];
    }

    public function setOptions(array $options): void
    {
        $this->options = $options === [] ? null : (json_encode($options) ?: null);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }
}
