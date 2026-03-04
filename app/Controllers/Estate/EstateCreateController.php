<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class EstateCreateController extends Controller
{
    // Required
    public string $title = '';

    public string $property_type = 'apartment';

    public string $marketing_type = 'sale';

    // Optional info
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

    private const array PROPERTY_TYPES = ['apartment', 'house', 'commercial', 'land', 'garage'];

    private const array MARKETING_TYPES = ['sale', 'rent', 'lease'];

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'title' => 'required|string|max:255',
                'property_type' => 'required|string|in:' . implode(',', self::PROPERTY_TYPES),
                'marketing_type' => 'required|string|in:' . implode(',', self::MARKETING_TYPES),
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $estate = new Estate();
        $estate->title = $this->title;
        $estate->property_type = $this->property_type;
        $estate->marketing_type = $this->marketing_type;
        $estate->status = 'draft';

        // Assign to current user
        $estate->assigned_user_id = $this->request->user['id'];
        $estate->office_id = $this->request->user['office_id'] ?? null;

        // Optional fields
        $estate->description = $this->description;
        $estate->external_id = $this->external_id;
        $estate->street = $this->street;
        $estate->house_number = $this->house_number;
        $estate->zip = $this->zip;
        $estate->city = $this->city;
        $estate->country = $this->country;
        $estate->latitude = $this->latitude;
        $estate->longitude = $this->longitude;
        $estate->price = $this->price;
        $estate->area_total = $this->area_total;
        $estate->area_living = $this->area_living;
        $estate->area_plot = $this->area_plot;
        $estate->rooms = $this->rooms;
        $estate->bedrooms = $this->bedrooms;
        $estate->bathrooms = $this->bathrooms;
        $estate->floor = $this->floor;
        $estate->floors_total = $this->floors_total;
        $estate->year_built = $this->year_built;
        $estate->parking_spaces = $this->parking_spaces;
        $estate->heating_type = $this->heating_type;
        $estate->energy_rating = $this->energy_rating;
        $estate->condition = $this->condition;
        $estate->furnished = $this->furnished;
        $estate->balcony = $this->balcony;
        $estate->garden = $this->garden;
        $estate->elevator = $this->elevator;
        $estate->cellar = $this->cellar;
        $estate->virtual_tour_url = $this->virtual_tour_url;
        $estate->owner_contact_id = $this->owner_contact_id;

        $estate->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'estate',
            $estate->id,
            [],
            ClientIp::from($this->request, true),
            $this->request->user['office_id'] ?? null,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $activityService->log(
            type: 'estate_created',
            subject: 'Estate created: ' . $estate->title,
            userId: $this->request->user['id'],
            officeId: $estate->office_id,
            estateId: $estate->id,
        );

        CacheHelper::forget('dashboard', $estate->office_id ?? 'none');

        return JsonResponse::created($estate->toArray());
    }
}
