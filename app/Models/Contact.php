<?php

namespace App\Models;

use Override;
use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class Contact extends BaseModel
{
    // Identity
    public string $type = 'misc';

    public string $entity_type = 'person';

    public ?string $company_name = null;

    public ?string $salutation = null;

    public ?string $first_name = null;

    public ?string $last_name = null;

    // Communication
    public ?string $email = null;

    public ?string $phone = null;

    public ?string $mobile = null;

    // Address
    public ?string $street = null;

    public ?string $zip = null;

    public ?string $city = null;

    public ?string $country = null;

    // CRM
    public string $stage = 'cold';

    public ?string $assigned_user_id = null;

    public ?string $office_id = null;

    // Custom (stored as JSON strings)
    public ?string $custom_fields = null;

    public ?string $search_profiles = null;

    // GDPR
    public bool $gdpr_consent = false;

    public ?string $gdpr_consent_date = null;

    public bool $gdpr_deletion_requested = false;

    public ?string $gdpr_deletion_requested_at = null;

    // Notes
    public ?string $notes = null;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'type' => ['type' => 'VARCHAR(50)'],
        'entity_type' => ['type' => 'VARCHAR(20)'],
        'stage' => ['type' => 'VARCHAR(20)'],
        'notes' => ['type' => 'TEXT', 'nullable' => true],
        'custom_fields' => ['type' => 'JSON', 'nullable' => true],
        'search_profiles' => ['type' => 'JSON', 'nullable' => true],
        'gdpr_consent_date' => ['type' => 'DATETIME', 'nullable' => true],
        'gdpr_deletion_requested_at' => ['type' => 'DATETIME', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'type' => 'index',
        'entity_type' => 'index',
        'stage' => 'index',
        'email' => 'index',
        'assigned_user_id' => 'index',
        'office_id' => 'index',
        'last_name' => 'index',
        ['type', 'stage'],
        ['last_name', 'first_name'],
    ];

    public function getCustomFields(): array
    {
        if ($this->custom_fields === null || $this->custom_fields === '') {
            return [];
        }

        return json_decode($this->custom_fields, true) ?: [];
    }

    public function setCustomFields(array $fields): void
    {
        $this->custom_fields = json_encode($fields) ?: null;
    }

    public function getSearchProfiles(): array
    {
        if ($this->search_profiles === null || $this->search_profiles === '') {
            return [];
        }

        return json_decode($this->search_profiles, true) ?: [];
    }

    public function setSearchProfiles(array $profiles): void
    {
        $this->search_profiles = json_encode($profiles) ?: null;
    }

    #[Override]
    public function toArray(bool $includeRelations = false): array
    {
        $data = parent::toArray($includeRelations);
        $data['search_profiles'] = $this->getSearchProfiles();
        $data['custom_fields'] = $this->getCustomFields();

        return $data;
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function relationships(): HasMany
    {
        return $this->hasMany(ContactRelationship::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function emails(): HasMany
    {
        return $this->hasMany(Email::class);
    }
}
