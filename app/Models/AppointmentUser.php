<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class AppointmentUser extends BaseModel
{
    public string $appointment_id = '';

    public string $user_id = '';

    public string $role = 'attendee';

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'role' => ['type' => 'VARCHAR(20)'],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        ['appointment_id', 'user_id', 'type' => 'unique'],
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
