<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class Estate extends BaseModel
{
    // Classification
    public string $property_type = 'apartment';

    public string $marketing_type = 'sale';

    public string $status = 'draft';

    // Info
    public string $title = '';

    public ?string $description = null;

    public ?string $external_id = null;

    // Location
    public ?string $street = null;

    public ?string $house_number = null;

    public ?string $zip = null;

    public ?string $city = null;

    public ?string $country = null;

    public ?float $latitude = null;

    public ?float $longitude = null;

    // Details
    public ?float $price = null;

    public ?float $area_total = null;

    public ?float $area_living = null;

    public ?float $area_plot = null;

    public ?int $rooms = null;

    public ?int $bedrooms = null;

    public ?int $bathrooms = null;

    public ?int $floor = null;

    public ?int $floors_total = null;

    public ?int $year_built = null;

    public ?int $parking_spaces = null;

    // Features
    public ?string $heating_type = null;

    public ?string $energy_rating = null;

    public ?string $condition = null;

    public bool $furnished = false;

    public bool $balcony = false;

    public bool $garden = false;

    public bool $elevator = false;

    public bool $cellar = false;

    // Virtual tour
    public ?string $virtual_tour_url = null;

    // Links
    public ?string $owner_contact_id = null;

    public ?string $assigned_user_id = null;

    public ?string $office_id = null;

    // Custom
    public ?string $custom_fields = null;

    public function getCustomFields(): array
    {
        if ($this->custom_fields === null || $this->custom_fields === '') {
            return [];
        }

        return json_decode($this->custom_fields, true) ?: [];
    }

    public function setCustomFields(array $fields): void
    {
        $this->custom_fields = $fields === [] ? null : (json_encode($fields) ?: null);
    }

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'property_type' => ['type' => 'VARCHAR(50)'],
        'marketing_type' => ['type' => 'VARCHAR(20)'],
        'status' => ['type' => 'VARCHAR(20)'],
        'description' => ['type' => 'TEXT', 'nullable' => true],
        'external_id' => ['type' => 'VARCHAR(100)', 'nullable' => true],
        'virtual_tour_url' => ['type' => 'VARCHAR(2048)', 'nullable' => true],
        'custom_fields' => ['type' => 'JSON', 'nullable' => true],
    ];

    /** @var array<int|string, mixed> */
    public static array $indexes = [
        'property_type' => 'index',
        'marketing_type' => 'index',
        'status' => 'index',
        'external_id' => 'index',
        'city' => 'index',
        'zip' => 'index',
        'price' => 'index',
        ['property_type', 'marketing_type', 'status'],
        ['city', 'property_type'],
    ];

    public function toArray(bool $includeRelations = false): array
    {
        $data = parent::toArray($includeRelations);
        $data['custom_fields'] = $this->getCustomFields();

        return $data;
    }

    public function ownerContact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'owner_contact_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(EstateImage::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(EstateContact::class);
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
