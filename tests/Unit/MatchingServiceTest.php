<?php

namespace App\Tests\Unit;

use App\Models\Estate;
use App\Services\MatchingService;
use PHPUnit\Framework\TestCase;

class MatchingServiceTest extends TestCase
{
    private MatchingService $service;

    protected function setUp(): void
    {
        $this->service = new MatchingService();
    }

    private function makeEstate(array $overrides = []): Estate
    {
        $defaults = [
            'property_type' => 'apartment',
            'marketing_type' => 'sale',
            'status' => 'active',
            'title' => 'Test Estate',
            'price' => 300000,
            'area_living' => 80,
            'rooms' => 3,
            'bedrooms' => 2,
            'city' => 'Berlin',
            'furnished' => false,
            'balcony' => true,
            'garden' => false,
            'elevator' => false,
            'cellar' => true,
        ];

        $estate = new Estate();
        $merged = array_merge($defaults, $overrides);
        foreach ($merged as $key => $value) {
            $estate->{$key} = $value;
        }

        return $estate;
    }

    public function test_all_criteria_matched_returns_100(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Test',
            'property_types' => ['apartment'],
            'marketing_type' => 'sale',
            'price_min' => 200000,
            'price_max' => 400000,
            'area_min' => 60,
            'area_max' => 100,
            'rooms_min' => 2,
            'rooms_max' => 4,
            'cities' => ['Berlin'],
            'balcony' => true,
            'cellar' => true,
            'furnished' => null,
            'garden' => null,
            'elevator' => null,
        ];

        $estate = $this->makeEstate();
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(100.0, $result['score']);
        $this->assertNotEmpty($result['matched']);
        $this->assertEmpty($result['unmatched']);
    }

    public function test_no_criteria_defined_returns_100(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Empty',
            'property_types' => [],
            'marketing_type' => null,
            'price_min' => null,
            'price_max' => null,
            'area_min' => null,
            'area_max' => null,
            'rooms_min' => null,
            'rooms_max' => null,
            'cities' => [],
            'furnished' => null,
            'balcony' => null,
            'garden' => null,
            'elevator' => null,
            'cellar' => null,
        ];

        $estate = $this->makeEstate();
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(100.0, $result['score']);
        $this->assertEmpty($result['matched']);
        $this->assertEmpty($result['unmatched']);
    }

    public function test_half_matched_returns_50(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Half',
            'property_types' => ['apartment'],
            'marketing_type' => 'rent',  // won't match (estate is sale)
            'price_min' => null,
            'price_max' => null,
            'area_min' => null,
            'area_max' => null,
            'rooms_min' => null,
            'rooms_max' => null,
            'cities' => [],
            'furnished' => null,
            'balcony' => null,
            'garden' => null,
            'elevator' => null,
            'cellar' => null,
        ];

        $estate = $this->makeEstate();
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(50.0, $result['score']);
        $this->assertContains('property_types', $result['matched']);
        $this->assertContains('marketing_type', $result['unmatched']);
    }

    public function test_boolean_must_have_not_met_deducts(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Test',
            'property_types' => [],
            'marketing_type' => null,
            'price_min' => null,
            'price_max' => null,
            'area_min' => null,
            'area_max' => null,
            'rooms_min' => null,
            'rooms_max' => null,
            'cities' => [],
            'furnished' => true,  // estate is not furnished
            'balcony' => true,    // estate has balcony
            'garden' => null,
            'elevator' => null,
            'cellar' => null,
        ];

        $estate = $this->makeEstate();
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(50.0, $result['score']);
        $this->assertContains('balcony', $result['matched']);
        $this->assertContains('furnished', $result['unmatched']);
    }

    public function test_city_case_insensitive(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Test',
            'property_types' => [],
            'marketing_type' => null,
            'price_min' => null,
            'price_max' => null,
            'area_min' => null,
            'area_max' => null,
            'rooms_min' => null,
            'rooms_max' => null,
            'cities' => ['BERLIN', 'munich'],
            'furnished' => null,
            'balcony' => null,
            'garden' => null,
            'elevator' => null,
            'cellar' => null,
        ];

        $estate = $this->makeEstate(['city' => 'berlin']);
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(100.0, $result['score']);
        $this->assertContains('cities', $result['matched']);
    }

    public function test_price_out_of_range(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Test',
            'property_types' => [],
            'marketing_type' => null,
            'price_min' => 500000,
            'price_max' => 700000,
            'area_min' => null,
            'area_max' => null,
            'rooms_min' => null,
            'rooms_max' => null,
            'cities' => [],
            'furnished' => null,
            'balcony' => null,
            'garden' => null,
            'elevator' => null,
            'cellar' => null,
        ];

        $estate = $this->makeEstate(['price' => 300000]);
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(0.0, $result['score']);
        $this->assertContains('price', $result['unmatched']);
    }

    public function test_null_estate_field_does_not_match_range(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Test',
            'property_types' => [],
            'marketing_type' => null,
            'price_min' => 100000,
            'price_max' => 500000,
            'area_min' => null,
            'area_max' => null,
            'rooms_min' => null,
            'rooms_max' => null,
            'cities' => [],
            'furnished' => null,
            'balcony' => null,
            'garden' => null,
            'elevator' => null,
            'cellar' => null,
        ];

        $estate = $this->makeEstate(['price' => null]);
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(0.0, $result['score']);
        $this->assertContains('price', $result['unmatched']);
    }

    public function test_only_min_range_matches(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Test',
            'property_types' => [],
            'marketing_type' => null,
            'price_min' => 200000,
            'price_max' => null,
            'area_min' => null,
            'area_max' => null,
            'rooms_min' => null,
            'rooms_max' => null,
            'cities' => [],
            'furnished' => null,
            'balcony' => null,
            'garden' => null,
            'elevator' => null,
            'cellar' => null,
        ];

        $estate = $this->makeEstate(['price' => 300000]);
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(100.0, $result['score']);
        $this->assertContains('price', $result['matched']);
    }

    public function test_empty_city_on_estate_does_not_match(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Test',
            'property_types' => [],
            'marketing_type' => null,
            'price_min' => null,
            'price_max' => null,
            'area_min' => null,
            'area_max' => null,
            'rooms_min' => null,
            'rooms_max' => null,
            'cities' => ['Berlin'],
            'furnished' => null,
            'balcony' => null,
            'garden' => null,
            'elevator' => null,
            'cellar' => null,
        ];

        $estate = $this->makeEstate(['city' => null]);
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(0.0, $result['score']);
        $this->assertContains('cities', $result['unmatched']);
    }

    public function test_wrong_property_type_does_not_match(): void
    {
        $profile = [
            'id' => 'p1',
            'name' => 'Test',
            'property_types' => ['house', 'land'],
            'marketing_type' => null,
            'price_min' => null,
            'price_max' => null,
            'area_min' => null,
            'area_max' => null,
            'rooms_min' => null,
            'rooms_max' => null,
            'cities' => [],
            'furnished' => null,
            'balcony' => null,
            'garden' => null,
            'elevator' => null,
            'cellar' => null,
        ];

        $estate = $this->makeEstate(['property_type' => 'apartment']);
        $result = $this->service->scoreProfileAgainstEstate($profile, $estate);

        $this->assertEquals(0.0, $result['score']);
        $this->assertContains('property_types', $result['unmatched']);
    }
}
