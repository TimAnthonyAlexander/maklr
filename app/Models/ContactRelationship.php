<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class ContactRelationship extends BaseModel
{
    public string $contact_id = '';

    public string $related_contact_id = '';

    public string $type = '';

    public ?string $notes = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'type' => ['type' => 'VARCHAR(50)'],
        'notes' => ['type' => 'TEXT', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'contact_id' => 'index',
        ['contact_id', 'related_contact_id', 'type' => 'unique'],
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function relatedContact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'related_contact_id');
    }
}
