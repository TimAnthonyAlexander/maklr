<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class EstateContact extends BaseModel
{
    public string $estate_id = '';

    public string $contact_id = '';

    public string $role = 'interested';

    public ?string $notes = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'role' => ['type' => 'VARCHAR(30)'],
        'notes' => ['type' => 'TEXT', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        ['estate_id', 'contact_id', 'role', 'type' => 'unique'],
    ];

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
