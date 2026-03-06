<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class WebsitePage extends BaseModel
{
    public string $title = '';

    public string $slug = '';

    public ?string $html_content = null;

    public int $sort_order = 0;

    public bool $published = false;

    public ?string $website_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'slug' => ['type' => 'VARCHAR(100)'],
        'html_content' => ['type' => 'MEDIUMTEXT', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        ['website_id', 'slug', 'type' => 'unique'],
        'website_id' => 'index',
    ];

    public function versions(): HasMany
    {
        return $this->hasMany(WebsitePageVersion::class, 'page_id');
    }

    public function website(): BelongsTo
    {
        return $this->belongsTo(Website::class);
    }
}
