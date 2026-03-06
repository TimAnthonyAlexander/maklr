<?php

namespace App\Models;

use Override;
use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class SyncLog extends BaseModel
{
    public string $portal_id = '';

    public ?string $estate_id = null;

    public string $action = '';

    public string $status = 'started';

    public ?string $error_message = null;

    public ?string $details = null;

    public ?string $office_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'action' => ['type' => 'VARCHAR(50)'],
        'status' => ['type' => 'VARCHAR(20)'],
        'error_message' => ['type' => 'TEXT', 'nullable' => true],
        'details' => ['type' => 'JSON', 'nullable' => true],
    ];

    /** @var array<int|string, string|array<int|string, string>> */
    public static array $indexes = [
        'portal_id' => 'index',
        'estate_id' => 'index',
        'status' => 'index',
        'office_id' => 'index',
        ['portal_id', 'status'],
    ];

    public function portal(): BelongsTo
    {
        return $this->belongsTo(Portal::class);
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function getDetails(): array
    {
        if ($this->details === null || $this->details === '') {
            return [];
        }

        return json_decode($this->details, true) ?: [];
    }

    public function setDetails(array $details): void
    {
        $this->details = $details === [] ? null : (json_encode($details) ?: null);
    }

    #[Override]
    public function toArray(bool $deep = false): array
    {
        $data = parent::toArray($deep);
        $data['details'] = $this->getDetails();

        return $data;
    }
}
