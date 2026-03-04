<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class Invitation extends BaseModel
{
    public string $office_id = '';

    public string $email = '';

    public string $token_hash = '';

    public string $role = 'agent';

    public string $invited_by = '';

    public ?string $expires_at = null;

    public ?string $accepted_at = null;

    /**
     * @var array<string, string>
     */
    public static array $indexes = [
        'token_hash' => 'unique',
        'office_id' => 'index',
        'email' => 'index',
    ];

    /**
     * @var array<string, array<string, mixed>>
     */
    public static array $columns = [
        'token_hash' => ['type' => 'TEXT', 'length' => 255],
        'email' => ['type' => 'TEXT', 'length' => 255],
        'role' => ['type' => 'VARCHAR(20)'],
        'expires_at' => ['type' => 'TEXT', 'nullable' => true],
        'accepted_at' => ['type' => 'TEXT', 'nullable' => true],
    ];

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function isExpired(): bool
    {
        if ($this->expires_at === null || $this->expires_at === '') {
            return false;
        }

        return strtotime($this->expires_at) < time();
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null && $this->accepted_at !== '';
    }

    /**
     * Generate a secure invitation token
     */
    public static function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Hash a token for storage
     */
    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * Find invitation by plain text token
     */
    public static function findByToken(string $token): ?self
    {
        $hash = self::hashToken($token);
        return self::firstWhere('token_hash', '=', $hash);
    }
}
