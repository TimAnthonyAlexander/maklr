<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class Website extends BaseModel
{
    public string $name = '';

    public string $slug = '';

    public ?string $description = null;

    public bool $published = false;

    public ?string $user_id = null;

    public ?string $office_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'slug' => ['type' => 'VARCHAR(100)'],
        'description' => ['type' => 'TEXT', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'slug' => 'unique',
        'office_id' => 'index',
        'user_id' => 'index',
    ];

    public function pages(): HasMany
    {
        return $this->hasMany(WebsitePage::class);
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(WebsiteChatMessage::class);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
