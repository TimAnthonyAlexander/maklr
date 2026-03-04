<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class Document extends BaseModel
{
    public string $file_path = '';

    public string $file_name = '';

    public string $mime_type = '';

    public int $file_size = 0;

    public ?string $category = null;

    public ?string $office_id = null;

    public ?string $estate_id = null;

    public ?string $contact_id = null;

    public ?string $appointment_id = null;

    public ?string $email_id = null;

    public ?string $uploaded_by_user_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'file_path' => ['type' => 'VARCHAR(500)'],
        'category' => ['type' => 'VARCHAR(30)', 'nullable' => true],
    ];

    /** @var array<string, string|string[]> */
    public static array $indexes = [
        'office_id' => 'index',
        'estate_id' => 'index',
        'contact_id' => 'index',
        'appointment_id' => 'index',
        'category' => 'index',
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

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function email(): BelongsTo
    {
        return $this->belongsTo(Email::class);
    }

    public function uploadedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
