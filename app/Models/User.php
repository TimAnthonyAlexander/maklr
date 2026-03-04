<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class User extends BaseModel
{
    public string $name = '';

    public string $password = '';

    public string $email = '';

    public bool $active = true;

    public string $role = 'guest';

    public ?string $office_id = null;

    public ?string $phone = null;

    public ?string $avatar_url = null;

    public string $language = 'en';

    /**
     * Define indexes for this model
     * @var array<string, mixed>
     */
    public static array $indexes = [
        'email' => 'unique',
        'office_id' => 'index',
        'role' => 'index',
        'active' => 'index',
    ];

    public function checkPassword(string $password): bool
    {
        return password_verify($password, $this->password);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function apiTokens(): HasMany
    {
        return $this->hasMany(ApiToken::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }
}
