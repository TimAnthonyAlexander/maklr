<?php

namespace App\Models;

use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

class Office extends BaseModel
{
    public string $name = '';

    public ?string $address = null;

    public ?string $city = null;

    public ?string $zip = null;

    public ?string $country = null;

    public ?string $phone = null;

    public ?string $email = null;

    public bool $active = true;

    /** @var array<string, string> */
    public static array $indexes = [
        'name' => 'index',
        'active' => 'index',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
