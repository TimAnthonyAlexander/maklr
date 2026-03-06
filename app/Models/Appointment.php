<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class Appointment extends BaseModel
{
    public string $title = '';

    public ?string $description = null;

    public string $type = 'other';

    public ?string $starts_at = null;

    public ?string $ends_at = null;

    public bool $is_all_day = false;

    public ?string $location = null;

    public ?string $estate_id = null;

    public ?string $created_by_user_id = null;

    public ?string $office_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'description' => ['type' => 'TEXT', 'nullable' => true],
        'type' => ['type' => 'VARCHAR(30)'],
        'starts_at' => ['type' => 'DATETIME', 'nullable' => true],
        'ends_at' => ['type' => 'DATETIME', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'estate_id' => 'index',
        'type' => 'index',
        'office_id' => 'index',
        'created_by_user_id' => 'index',
        ['office_id', 'starts_at'],
    ];

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function appointmentContacts(): HasMany
    {
        return $this->hasMany(AppointmentContact::class);
    }

    public function appointmentUsers(): HasMany
    {
        return $this->hasMany(AppointmentUser::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
