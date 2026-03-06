<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class WebsiteChatMessage extends BaseModel
{
    public string $role = 'user';

    public ?string $content = null;

    public ?string $website_id = null;

    public ?string $page_id = null;

    public ?string $user_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'role' => ['type' => 'VARCHAR(20)'],
        'content' => ['type' => 'TEXT', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'website_id' => 'index',
        'page_id' => 'index',
        ['website_id', 'created_at'],
    ];

    /** @var array<string, array<string, string>> */
    public static array $foreignKeys = [
        'page_id' => ['on_delete' => 'SET NULL', 'on_update' => 'CASCADE'],
    ];

    public function website(): BelongsTo
    {
        return $this->belongsTo(Website::class);
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(WebsitePage::class, 'page_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
