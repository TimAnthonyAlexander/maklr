<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class EmailTemplate extends BaseModel
{
    public string $name = '';

    public string $subject = '';

    public ?string $body_html = null;

    public ?string $body_text = null;

    public ?string $category = null;

    public string $scope = 'personal';

    public bool $active = true;

    public ?string $office_id = null;

    public ?string $created_by_user_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'name' => ['type' => 'VARCHAR(100)'],
        'body_html' => ['type' => 'MEDIUMTEXT', 'nullable' => true],
        'body_text' => ['type' => 'MEDIUMTEXT', 'nullable' => true],
        'category' => ['type' => 'VARCHAR(50)', 'nullable' => true],
        'scope' => ['type' => 'VARCHAR(20)'],
    ];

    /** @var array<string, string> */
    public static array $indexes = [
        'name' => 'index',
        'active' => 'index',
        'category' => 'index',
        'scope' => 'index',
        'office_id' => 'index',
        'created_by_user_id' => 'index',
    ];

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
