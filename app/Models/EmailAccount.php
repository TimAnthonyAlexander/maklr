<?php

namespace App\Models;

use Override;
use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class EmailAccount extends BaseModel
{
    public string $user_id = '';

    public ?string $office_id = null;

    public string $scope = 'personal';

    public string $name = '';

    public string $email_address = '';

    public string $imap_host = '';

    public int $imap_port = 993;

    public string $imap_encryption = 'ssl';

    public string $smtp_host = '';

    public int $smtp_port = 465;

    public string $smtp_encryption = 'ssl';

    public string $username = '';

    public ?string $password_encrypted = null;

    public bool $active = true;

    public ?string $last_sync_at = null;

    public ?string $last_error = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'name' => ['type' => 'VARCHAR(100)'],
        'scope' => ['type' => 'VARCHAR(20)'],
        'imap_encryption' => ['type' => 'VARCHAR(10)'],
        'smtp_encryption' => ['type' => 'VARCHAR(10)'],
        'password_encrypted' => ['type' => 'TEXT', 'nullable' => true],
        'last_sync_at' => ['type' => 'DATETIME', 'nullable' => true],
        'last_error' => ['type' => 'TEXT', 'nullable' => true],
    ];

    /** @var array<int|string, string|array<int|string, string>> */
    public static array $indexes = [
        'user_id' => 'index',
        'office_id' => 'index',
        'active' => 'index',
        ['user_id', 'scope'],
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class, 'office_id');
    }

    public function emails(): HasMany
    {
        return $this->hasMany(Email::class);
    }

    /**
     * Convert to array, stripping the encrypted password.
     *
     * @return array<string, mixed>
     */
    #[Override]
    public function toArray(bool $deep = false): array
    {
        $data = parent::toArray($deep);
        unset($data['password_encrypted']);

        return $data;
    }
}
