<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class WebsitePageVersion extends BaseModel
{
    public ?string $page_id = null;

    public ?string $html_content = null;

    public int $version_number = 0;

    public ?string $change_summary = null;

    public ?string $created_by_user_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'html_content' => ['type' => 'MEDIUMTEXT', 'nullable' => true],
        'change_summary' => ['type' => 'VARCHAR(500)', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        ['page_id', 'version_number', 'type' => 'unique'],
        'page_id' => 'index',
    ];

    /** @var array<string, array<string, string>> */
    public static array $foreignKeys = [
        'created_by_user_id' => ['on_delete' => 'SET NULL', 'on_update' => 'CASCADE'],
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(WebsitePage::class, 'page_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
