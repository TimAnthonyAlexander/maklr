<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class TaskUser extends BaseModel
{
    public string $task_id = '';

    public string $user_id = '';

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        ['task_id', 'user_id', 'type' => 'unique'],
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
