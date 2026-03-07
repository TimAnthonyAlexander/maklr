<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class Task extends BaseModel
{
    public string $title = '';

    public ?string $description = null;

    public string $status = 'open';

    public string $priority = 'medium';

    public string $type = 'task';

    public ?string $due_date = null;

    public int $task_number = 0;

    public ?string $completed_at = null;

    public ?int $position = null;

    public ?string $office_id = null;

    public ?string $estate_id = null;

    public ?string $contact_id = null;

    public ?string $created_by_user_id = null;

    public ?string $process_step_instance_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'description' => ['type' => 'TEXT', 'nullable' => true],
        'status' => ['type' => 'VARCHAR(20)'],
        'priority' => ['type' => 'VARCHAR(20)'],
        'type' => ['type' => 'VARCHAR(30)'],
        'due_date' => ['type' => 'DATETIME', 'nullable' => true],
        'completed_at' => ['type' => 'DATETIME', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'status' => 'index',
        'priority' => 'index',
        'type' => 'index',
        'due_date' => 'index',
        'office_id' => 'index',
        'estate_id' => 'index',
        'contact_id' => 'index',
        'created_by_user_id' => 'index',
        'process_step_instance_id' => 'index',
        ['office_id', 'task_number', 'type' => 'unique'],
    ];

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function processStepInstance(): BelongsTo
    {
        return $this->belongsTo(ProcessStepInstance::class);
    }

    public function taskUsers(): HasMany
    {
        return $this->hasMany(TaskUser::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }
}
