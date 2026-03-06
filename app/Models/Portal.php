<?php

namespace App\Models;

use Override;
use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class Portal extends BaseModel
{
    public string $name = '';

    public string $portal_type = 'ftp';

    public ?string $ftp_host = null;

    public ?int $ftp_port = null;

    public ?string $ftp_username = null;

    public ?string $ftp_password_encrypted = null;

    public ?string $ftp_path = null;

    public bool $ftp_passive = true;

    public bool $ftp_ssl = false;

    public ?string $api_url = null;

    public ?string $api_key_encrypted = null;

    public ?string $provider_id = null;

    public bool $active = true;

    public ?string $last_sync_at = null;

    public ?string $last_error = null;

    public ?string $office_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'name' => ['type' => 'VARCHAR(100)'],
        'portal_type' => ['type' => 'VARCHAR(20)'],
        'ftp_host' => ['type' => 'VARCHAR(255)', 'nullable' => true],
        'ftp_password_encrypted' => ['type' => 'TEXT', 'nullable' => true],
        'ftp_path' => ['type' => 'VARCHAR(500)', 'nullable' => true],
        'api_url' => ['type' => 'VARCHAR(2048)', 'nullable' => true],
        'api_key_encrypted' => ['type' => 'TEXT', 'nullable' => true],
        'provider_id' => ['type' => 'VARCHAR(100)', 'nullable' => true],
        'last_sync_at' => ['type' => 'DATETIME', 'nullable' => true],
        'last_error' => ['type' => 'TEXT', 'nullable' => true],
    ];

    /** @var array<int|string, string|array<int|string, string>> */
    public static array $indexes = [
        'office_id' => 'index',
        'active' => 'index',
        'portal_type' => 'index',
        ['office_id', 'active'],
    ];

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function syndications(): HasMany
    {
        return $this->hasMany(EstateSyndication::class);
    }

    /**
     * Convert to array, stripping encrypted fields.
     *
     * @return array<string, mixed>
     */
    #[Override]
    public function toArray(bool $deep = false): array
    {
        $data = parent::toArray($deep);
        unset($data['ftp_password_encrypted'], $data['api_key_encrypted']);

        return $data;
    }
}
