<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use App\Services\CustomFieldValidationService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class EstateUpdateController extends Controller
{
    public string $id = '';

    // All patchable fields (nullable = only apply if sent)
    public ?string $title = null;

    public ?string $property_type = null;

    public ?string $marketing_type = null;

    public ?string $status = null;

    public ?string $description = null;

    public ?string $external_id = null;

    public ?string $street = null;

    public ?string $house_number = null;

    public ?string $zip = null;

    public ?string $city = null;

    public ?string $country = null;

    public ?float $latitude = null;

    public ?float $longitude = null;

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

    public ?string $heating_type = null;

    public ?string $energy_rating = null;

    public ?string $condition = null;

    public ?bool $furnished = null;

    public ?bool $balcony = null;

    public ?bool $garden = null;

    public ?bool $elevator = null;

    public ?bool $cellar = null;

    public ?string $virtual_tour_url = null;

    public ?string $owner_contact_id = null;

    public ?string $assigned_user_id = null;

    public ?string $office_id = null;

    public ?array $custom_fields = null;

    private const array PROPERTY_TYPES = ['apartment', 'house', 'commercial', 'land', 'garage'];

    private const array MARKETING_TYPES = ['sale', 'rent', 'lease'];

    private const array VALID_STATUSES = ['draft', 'active', 'reserved', 'sold', 'rented', 'archived'];

    private const array PATCHABLE_FIELDS = [
        'title', 'property_type', 'marketing_type', 'status',
        'description', 'external_id',
        'street', 'house_number', 'zip', 'city', 'country', 'latitude', 'longitude',
        'price', 'area_total', 'area_living', 'area_plot',
        'rooms', 'bedrooms', 'bathrooms', 'floor', 'floors_total', 'year_built', 'parking_spaces',
        'heating_type', 'energy_rating', 'condition',
        'furnished', 'balcony', 'garden', 'elevator', 'cellar',
        'virtual_tour_url', 'owner_contact_id', 'assigned_user_id',
    ];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        // Validate enum fields if provided
        try {
            if ($this->property_type !== null) {
                $this->validate(['property_type' => 'string|in:' . implode(',', self::PROPERTY_TYPES)]);
            }

            if ($this->marketing_type !== null) {
                $this->validate(['marketing_type' => 'string|in:' . implode(',', self::MARKETING_TYPES)]);
            }

            if ($this->status !== null) {
                $this->validate(['status' => 'string|in:' . implode(',', self::VALID_STATUSES)]);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        // Validate custom fields if provided
        if ($this->custom_fields !== null) {
            /** @var CustomFieldValidationService $cfValidator */
            $cfValidator = $this->make(CustomFieldValidationService::class);
            $cfErrors = $cfValidator->validate($this->custom_fields, 'estate', $officeId ?? '');
            if ($cfErrors !== []) {
                return JsonResponse::validationError($cfErrors);
            }
        }

        // Snapshot old values for audit
        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $estate->{$field};
        }

        // Apply non-null incoming values
        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $estate->{$field} = $this->{$field};
            }
        }

        // Handle custom_fields separately
        $oldCustomFields = $estate->getCustomFields();
        if ($this->custom_fields !== null) {
            $estate->setCustomFields($this->custom_fields);
        }

        $estate->save();

        // Compute diff for audit
        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $estate->{$field};
        }

        // Include custom_fields in audit diff
        if ($this->custom_fields !== null) {
            $newCustomFields = $estate->getCustomFields();
            if ($oldCustomFields !== $newCustomFields) {
                $oldData['custom_fields'] = $oldCustomFields;
                $newData['custom_fields'] = $newCustomFields;
            }
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, array_merge(self::PATCHABLE_FIELDS, ['custom_fields']));

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'estate',
            $estate->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        // Log activity for status changes
        if (isset($changes['status'])) {
            /** @var ActivityService $activityService */
            $activityService = $this->make(ActivityService::class);
            $activityService->log(
                type: 'estate_status_changed',
                subject: 'Estate status changed: ' . $estate->title,
                userId: $this->request->user['id'],
                officeId: $officeId,
                estateId: $estate->id,
                oldValue: (string) $changes['status']['old'],
                newValue: (string) $changes['status']['new'],
            );
        }

        CacheHelper::forget('dashboard', $officeId ?? 'none');

        return JsonResponse::ok($estate->toArray());
    }
}
