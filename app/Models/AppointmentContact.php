<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class AppointmentContact extends BaseModel
{
    public string $appointment_id = '';

    public string $contact_id = '';

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        ['appointment_id', 'contact_id', 'type' => 'unique'],
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
