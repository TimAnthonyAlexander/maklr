<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class TaskComment extends BaseModel
{
    public string $task_id = '';

    public string $user_id = '';

    public string $body = '';

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'body' => ['type' => 'TEXT'],
    ];

    /** @var array<string, string> */
    public static array $indexes = [
        'task_id' => 'index',
        'user_id' => 'index',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
