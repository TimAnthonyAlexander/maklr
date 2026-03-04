<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

class EstateImage extends BaseModel
{
    public string $estate_id = '';

    public string $file_path = '';

    public string $file_name = '';

    public string $mime_type = '';

    public int $file_size = 0;

    public string $category = 'photo';

    public int $sort_order = 0;

    public ?string $title = null;

    public ?string $alt_text = null;

    public bool $is_primary = false;

    /** @var array<string, array<string, mixed>> */
    public static array $columns = [
        'file_path' => ['type' => 'VARCHAR(500)'],
        'category' => ['type' => 'VARCHAR(20)'],
    ];

    /** @var array<string, string> */
    public static array $indexes = [
        'estate_id' => 'index',
        'category' => 'index',
    ];

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }
}
