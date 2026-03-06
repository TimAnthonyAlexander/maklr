<?php

namespace App\Controllers\Estate;

use App\Models\Estate;

trait EstateContextTrait
{
    /**
     * Build a human-readable context string from an estate model.
     */
    private function buildEstateContextFromModel(Estate $estate): string
    {
        $data = [
            'property_type' => $estate->property_type,
            'marketing_type' => $estate->marketing_type,
            'title' => $estate->title,
            'rooms' => $estate->rooms,
            'bedrooms' => $estate->bedrooms,
            'bathrooms' => $estate->bathrooms,
            'area_total' => $estate->area_total,
            'area_living' => $estate->area_living,
            'area_plot' => $estate->area_plot,
            'floor' => $estate->floor,
            'floors_total' => $estate->floors_total,
            'year_built' => $estate->year_built,
            'parking_spaces' => $estate->parking_spaces,
            'heating_type' => $estate->heating_type,
            'energy_rating' => $estate->energy_rating,
            'condition' => $estate->condition,
            'street' => $estate->street,
            'house_number' => $estate->house_number,
            'zip' => $estate->zip,
            'city' => $estate->city,
            'country' => $estate->country,
            'furnished' => $estate->furnished,
            'balcony' => $estate->balcony,
            'garden' => $estate->garden,
            'elevator' => $estate->elevator,
            'cellar' => $estate->cellar,
        ];

        return $this->buildEstateContext($data);
    }

    /**
     * Build a human-readable context string from estate data array.
     *
     * @param array<string, mixed> $data
     */
    private function buildEstateContext(array $data): string
    {
        $lines = [];

        $fields = [
            'property_type' => 'Property Type',
            'marketing_type' => 'Marketing Type',
            'title' => 'Title',
            'rooms' => 'Rooms',
            'bedrooms' => 'Bedrooms',
            'bathrooms' => 'Bathrooms',
            'area_total' => 'Total Area (m²)',
            'area_living' => 'Living Area (m²)',
            'area_plot' => 'Plot Area (m²)',
            'floor' => 'Floor',
            'floors_total' => 'Total Floors',
            'year_built' => 'Year Built',
            'parking_spaces' => 'Parking Spaces',
            'heating_type' => 'Heating Type',
            'energy_rating' => 'Energy Rating',
            'condition' => 'Condition',
            'street' => 'Street',
            'house_number' => 'House Number',
            'zip' => 'ZIP',
            'city' => 'City',
            'country' => 'Country',
        ];

        foreach ($fields as $key => $label) {
            $value = $data[$key] ?? null;
            if ($value !== null && $value !== '') {
                $lines[] = "{$label}: {$value}";
            }
        }

        $booleanFields = [
            'furnished' => 'Furnished',
            'balcony' => 'Balcony',
            'garden' => 'Garden',
            'elevator' => 'Elevator',
            'cellar' => 'Cellar',
        ];

        $features = [];
        foreach ($booleanFields as $key => $label) {
            if (!empty($data[$key])) {
                $features[] = $label;
            }
        }

        if ($features !== []) {
            $lines[] = 'Features: ' . implode(', ', $features);
        }

        return implode("\n", $lines);
    }
}
