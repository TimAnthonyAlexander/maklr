<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\Estate;

class MatchingService
{
    /**
     * Score a single search profile against an estate.
     *
     * @param array<string, mixed> $profile
     * @return array{score: float, matched: string[], unmatched: string[]}
     */
    public function scoreProfileAgainstEstate(array $profile, Estate $estate): array
    {
        $matched = [];
        $unmatched = [];

        // Property types
        $propertyTypes = $profile['property_types'] ?? [];
        if (is_array($propertyTypes) && $propertyTypes !== []) {
            if (in_array($estate->property_type, $propertyTypes, true)) {
                $matched[] = 'property_types';
            } else {
                $unmatched[] = 'property_types';
            }
        }

        // Marketing type
        $marketingType = $profile['marketing_type'] ?? null;
        if ($marketingType !== null && $marketingType !== '') {
            if ($estate->marketing_type === $marketingType) {
                $matched[] = 'marketing_type';
            } else {
                $unmatched[] = 'marketing_type';
            }
        }

        // Price range
        $this->scoreRange($profile, 'price', $estate->price, $matched, $unmatched);

        // Area range (matches area_living)
        $this->scoreRange($profile, 'area', $estate->area_living, $matched, $unmatched);

        // Rooms range
        $this->scoreRange($profile, 'rooms', $estate->rooms, $matched, $unmatched);

        // Bedrooms range
        $this->scoreRange($profile, 'bedrooms', $estate->bedrooms, $matched, $unmatched);

        // Cities
        $cities = $profile['cities'] ?? [];
        if (is_array($cities) && $cities !== []) {
            $estateCity = $estate->city;
            if ($estateCity !== null && $estateCity !== '') {
                $normalizedCities = array_map('mb_strtolower', $cities);
                if (in_array(mb_strtolower($estateCity), $normalizedCities, true)) {
                    $matched[] = 'cities';
                } else {
                    $unmatched[] = 'cities';
                }
            } else {
                $unmatched[] = 'cities';
            }
        }

        // Boolean features
        $booleanFeatures = ['furnished', 'balcony', 'garden', 'elevator', 'cellar'];
        foreach ($booleanFeatures as $booleanFeature) {
            $requirement = $profile[$booleanFeature] ?? null;
            if ($requirement === true) {
                if ($estate->{$booleanFeature}) {
                    $matched[] = $booleanFeature;
                } else {
                    $unmatched[] = $booleanFeature;
                }
            }
        }

        $totalCriteria = count($matched) + count($unmatched);
        $score = $totalCriteria === 0 ? 100.0 : round((count($matched) / $totalCriteria) * 100, 1);

        return [
            'score' => $score,
            'matched' => $matched,
            'unmatched' => $unmatched,
        ];
    }

    /**
     * Match a contact's search profiles against active estates in the office.
     *
     * @return array{items: array<int, array<string, mixed>>, total: int}
     */
    public function matchContactToEstates(Contact $contact, string $officeId): array
    {
        $profiles = $contact->getSearchProfiles();
        if ($profiles === []) {
            return ['items' => [], 'total' => 0];
        }

        $estates = Estate::where('office_id', '=', $officeId)
            ->where('status', '=', 'active')
            ->get();

        $results = [];

        foreach ($estates as $estate) {
            $bestScore = -1;
            $bestResult = null;

            foreach ($profiles as $profile) {
                $result = $this->scoreProfileAgainstEstate($profile, $estate);
                if ($result['score'] > $bestScore) {
                    $bestScore = $result['score'];
                    $bestResult = [
                        'estate' => $estate->toArray(),
                        'score' => $result['score'],
                        'profile_id' => $profile['id'] ?? '',
                        'profile_name' => $profile['name'] ?? '',
                        'matched' => $result['matched'],
                        'unmatched' => $result['unmatched'],
                    ];
                }
            }

            if ($bestResult !== null) {
                $results[] = $bestResult;
            }
        }

        usort($results, fn(array $a, array $b): int => $b['score'] <=> $a['score']);

        return ['items' => $results, 'total' => count($results)];
    }

    /**
     * Match an estate against buyer/tenant contacts with search profiles in the office.
     *
     * @return array{items: array<int, array<string, mixed>>, total: int}
     */
    public function matchEstateToContacts(Estate $estate, string $officeId): array
    {
        $contacts = Contact::where('office_id', '=', $officeId)
            ->whereIn('type', ['buyer', 'tenant'])
            ->get();

        $results = [];

        foreach ($contacts as $contact) {
            $profiles = $contact->getSearchProfiles();
            if ($profiles === []) {
                continue;
            }

            $bestScore = -1;
            $bestResult = null;

            foreach ($profiles as $profile) {
                $result = $this->scoreProfileAgainstEstate($profile, $estate);
                if ($result['score'] > $bestScore) {
                    $bestScore = $result['score'];
                    $bestResult = [
                        'contact' => $contact->toArray(),
                        'score' => $result['score'],
                        'profile_id' => $profile['id'] ?? '',
                        'profile_name' => $profile['name'] ?? '',
                        'matched' => $result['matched'],
                        'unmatched' => $result['unmatched'],
                    ];
                }
            }

            if ($bestResult !== null) {
                $results[] = $bestResult;
            }
        }

        usort($results, fn(array $a, array $b): int => $b['score'] <=> $a['score']);

        return ['items' => $results, 'total' => count($results)];
    }

    /**
     * Score a min/max range criterion against an estate value.
     *
     * @param array<string, mixed> $profile
     * @param string[] $matched
     * @param string[] $unmatched
     */
    private function scoreRange(array $profile, string $field, mixed $estateValue, array &$matched, array &$unmatched): void
    {
        $min = $profile[$field . '_min'] ?? null;
        $max = $profile[$field . '_max'] ?? null;

        if ($min === null && $max === null) {
            return;
        }

        if ($estateValue === null) {
            $unmatched[] = $field;
            return;
        }

        $inRange = true;
        if ($min !== null && $estateValue < $min) {
            $inRange = false;
        }

        if ($max !== null && $estateValue > $max) {
            $inRange = false;
        }

        if ($inRange) {
            $matched[] = $field;
        } else {
            $unmatched[] = $field;
        }
    }
}
