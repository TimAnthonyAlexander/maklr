<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class EstateSyndication extends BaseModel
{
    public string $estate_id = '';

    public string $portal_id = '';

    public bool $enabled = true;

    public string $sync_status = 'pending';

    public ?string $last_synced_at = null;

    public ?string $last_error = null;

    public ?string $external_id = null;

    public ?string $office_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'sync_status' => ['type' => 'VARCHAR(20)'],
        'last_synced_at' => ['type' => 'DATETIME', 'nullable' => true],
        'last_error' => ['type' => 'TEXT', 'nullable' => true],
        'external_id' => ['type' => 'VARCHAR(255)', 'nullable' => true],
    ];

    /** @var array<int|string, string|array<int|string, string>> */
    public static array $indexes = [
        'estate_id' => 'index',
        'portal_id' => 'index',
        'sync_status' => 'index',
        'office_id' => 'index',
        ['estate_id', 'portal_id', 'type' => 'unique'],
    ];

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function portal(): BelongsTo
    {
        return $this->belongsTo(Portal::class);
    }
}
