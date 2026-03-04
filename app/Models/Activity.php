<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class Activity extends BaseModel
{
    public string $type = '';

    public string $subject = '';

    public ?string $description = null;

    // Links
    public ?string $office_id = null;

    public ?string $user_id = null;

    public ?string $estate_id = null;

    public ?string $contact_id = null;

    public ?string $appointment_id = null;

    public ?string $task_id = null;

    public ?string $email_id = null;

    public ?string $document_id = null;

    // Status change tracking
    public ?string $old_value = null;

    public ?string $new_value = null;

    // Metadata
    public ?string $metadata = null;

    public function getMetadata(): array
    {
        if ($this->metadata === null || $this->metadata === '') {
            return [];
        }

        return json_decode($this->metadata, true) ?: [];
    }

    public function setMetadata(array $meta): void
    {
        $this->metadata = $meta === [] ? null : (json_encode($meta) ?: null);
    }

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'type' => ['type' => 'VARCHAR(50)'],
        'description' => ['type' => 'TEXT', 'nullable' => true],
        'old_value' => ['type' => 'VARCHAR(500)', 'nullable' => true],
        'new_value' => ['type' => 'VARCHAR(500)', 'nullable' => true],
        'metadata' => ['type' => 'JSON', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'type' => 'index',
        'user_id' => 'index',
        'office_id' => 'index',
        'estate_id' => 'index',
        'contact_id' => 'index',
        ['office_id', 'created_at'],
        ['estate_id', 'created_at'],
        ['contact_id', 'created_at'],
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function email(): BelongsTo
    {
        return $this->belongsTo(Email::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
