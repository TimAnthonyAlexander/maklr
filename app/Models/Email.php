<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class Email extends BaseModel
{
    public string $email_account_id = '';

    public ?string $office_id = null;

    public string $direction = 'incoming';

    public string $status = 'received';

    public ?string $folder = null;

    public bool $read = false;

    // Headers
    public ?string $message_id = null;

    public ?string $in_reply_to = null;

    public string $from_address = '';

    public ?string $from_name = null;

    public string $to_addresses = '';

    public ?string $to_names = null;

    public ?string $cc_addresses = null;

    public ?string $cc_names = null;

    public ?string $bcc_addresses = null;

    public string $subject = '';

    // Body
    public ?string $body_html = null;

    public ?string $body_text = null;

    // Dates
    public ?string $sent_at = null;

    public ?string $received_at = null;

    // Links
    public ?string $contact_id = null;

    public ?string $estate_id = null;

    public ?string $email_template_id = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'direction' => ['type' => 'VARCHAR(20)'],
        'status' => ['type' => 'VARCHAR(20)'],
        'folder' => ['type' => 'VARCHAR(20)', 'nullable' => true],
        'message_id' => ['type' => 'VARCHAR(500)', 'nullable' => true],
        'in_reply_to' => ['type' => 'VARCHAR(500)', 'nullable' => true],
        'to_addresses' => ['type' => 'TEXT'],
        'to_names' => ['type' => 'TEXT', 'nullable' => true],
        'cc_addresses' => ['type' => 'TEXT', 'nullable' => true],
        'cc_names' => ['type' => 'TEXT', 'nullable' => true],
        'bcc_addresses' => ['type' => 'TEXT', 'nullable' => true],
        'body_html' => ['type' => 'MEDIUMTEXT', 'nullable' => true],
        'body_text' => ['type' => 'MEDIUMTEXT', 'nullable' => true],
        'sent_at' => ['type' => 'DATETIME', 'nullable' => true],
        'received_at' => ['type' => 'DATETIME', 'nullable' => true],
    ];

    /** @var array<string, string> */
    public static array $indexes = [
        'email_account_id' => 'index',
        'office_id' => 'index',
        'direction' => 'index',
        'status' => 'index',
        'folder' => 'index',
        'contact_id' => 'index',
        'estate_id' => 'index',
        'message_id' => 'index',
    ];

    public function emailAccount(): BelongsTo
    {
        return $this->belongsTo(EmailAccount::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function emailTemplate(): BelongsTo
    {
        return $this->belongsTo(EmailTemplate::class, 'email_template_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
