# Estate CRUD Controllers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete Estate CRUD controllers (list, show, create, update, delete) with audit logging, validation, and role-based access — following existing Office/User controller patterns.

**Architecture:** One controller per action under `app/Controllers/Estate/`. Controllers handle HTTP only — validation, auth checks, response formatting. AuditLogService logs all mutations. Estates support soft-delete via `status = 'archived'` (no `active` column — use status lifecycle instead). Role access: agents+ can read, agents+ can create/update own, managers+ can update any in office, admins can do anything.

**Tech Stack:** PHP 8.4, BaseAPI framework, MySQL, PHPUnit

---

### Task 1: EstateListController

**Files:**
- Create: `app/Controllers/Estate/EstateListController.php`
- Test: `tests/Feature/EstateCrudTest.php`

**Step 1: Write the failing test**

Create `tests/Feature/EstateCrudTest.php`:

```php
<?php

namespace App\Tests\Feature;

use BaseApi\Testing\TestCase;
use App\Models\Estate;

class EstateCrudTest extends TestCase
{
    private function adminUser(array $overrides = []): array
    {
        return array_merge([
            'id' => 'admin-user-id',
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'role' => 'admin',
            'office_id' => 'office-1',
        ], $overrides);
    }

    private function agentUser(array $overrides = []): array
    {
        return array_merge([
            'id' => 'agent-user-id',
            'name' => 'Agent User',
            'email' => 'agent@test.com',
            'role' => 'agent',
            'office_id' => 'office-1',
        ], $overrides);
    }

    private function createEstate(array $overrides = []): Estate
    {
        $estate = new Estate();
        $estate->title = $overrides['title'] ?? 'Test Estate ' . uniqid();
        $estate->property_type = $overrides['property_type'] ?? 'apartment';
        $estate->marketing_type = $overrides['marketing_type'] ?? 'sale';
        $estate->status = $overrides['status'] ?? 'active';
        $estate->office_id = $overrides['office_id'] ?? 'office-1';
        $estate->assigned_user_id = $overrides['assigned_user_id'] ?? 'agent-user-id';
        $estate->save();

        return $estate;
    }

    // --- List ---

    public function test_agent_can_list_estates(): void
    {
        $estate = $this->createEstate();

        $response = $this->actingAs($this->agentUser())
            ->get('/estates');

        $response->assertOk();
        $response->assertJsonHas('data');

        $estate->delete();
    }

    public function test_list_estates_supports_pagination(): void
    {
        $estate = $this->createEstate();

        $response = $this->actingAs($this->agentUser())
            ->get('/estates', ['page' => 1, 'per_page' => 5]);

        $response->assertOk();
        $response->assertJsonHas('pagination');

        $estate->delete();
    }

    public function test_list_estates_filters_by_status(): void
    {
        $active = $this->createEstate(['status' => 'active', 'title' => 'Active ' . uniqid()]);
        $draft = $this->createEstate(['status' => 'draft', 'title' => 'Draft ' . uniqid()]);

        $response = $this->actingAs($this->agentUser())
            ->get('/estates', ['status' => 'active']);

        $response->assertOk();
        $data = $response->json()['data'] ?? [];
        $ids = array_column($data, 'id');
        $this->assertContains($active->id, $ids);
        $this->assertNotContains($draft->id, $ids);

        $active->delete();
        $draft->delete();
    }

    public function test_list_estates_filters_by_property_type(): void
    {
        $apt = $this->createEstate(['property_type' => 'apartment', 'title' => 'Apt ' . uniqid()]);
        $house = $this->createEstate(['property_type' => 'house', 'title' => 'House ' . uniqid()]);

        $response = $this->actingAs($this->agentUser())
            ->get('/estates', ['property_type' => 'apartment']);

        $response->assertOk();
        $data = $response->json()['data'] ?? [];
        $ids = array_column($data, 'id');
        $this->assertContains($apt->id, $ids);
        $this->assertNotContains($house->id, $ids);

        $apt->delete();
        $house->delete();
    }

    public function test_list_estates_filters_by_marketing_type(): void
    {
        $sale = $this->createEstate(['marketing_type' => 'sale', 'title' => 'Sale ' . uniqid()]);
        $rent = $this->createEstate(['marketing_type' => 'rent', 'title' => 'Rent ' . uniqid()]);

        $response = $this->actingAs($this->agentUser())
            ->get('/estates', ['marketing_type' => 'sale']);

        $response->assertOk();
        $data = $response->json()['data'] ?? [];
        $ids = array_column($data, 'id');
        $this->assertContains($sale->id, $ids);
        $this->assertNotContains($rent->id, $ids);

        $sale->delete();
        $rent->delete();
    }

    public function test_list_estates_filters_by_city(): void
    {
        $berlin = $this->createEstate(['title' => 'Berlin ' . uniqid()]);
        $berlin->city = 'Berlin';
        $berlin->save();

        $munich = $this->createEstate(['title' => 'Munich ' . uniqid()]);
        $munich->city = 'Munich';
        $munich->save();

        $response = $this->actingAs($this->agentUser())
            ->get('/estates', ['city' => 'Berlin']);

        $response->assertOk();
        $data = $response->json()['data'] ?? [];
        $ids = array_column($data, 'id');
        $this->assertContains($berlin->id, $ids);
        $this->assertNotContains($munich->id, $ids);

        $berlin->delete();
        $munich->delete();
    }

    public function test_list_estates_filters_by_price_range(): void
    {
        $cheap = $this->createEstate(['title' => 'Cheap ' . uniqid()]);
        $cheap->price = 100000;
        $cheap->save();

        $expensive = $this->createEstate(['title' => 'Expensive ' . uniqid()]);
        $expensive->price = 900000;
        $expensive->save();

        $response = $this->actingAs($this->agentUser())
            ->get('/estates', ['price_min' => 50000, 'price_max' => 500000]);

        $response->assertOk();
        $data = $response->json()['data'] ?? [];
        $ids = array_column($data, 'id');
        $this->assertContains($cheap->id, $ids);
        $this->assertNotContains($expensive->id, $ids);

        $cheap->delete();
        $expensive->delete();
    }

    public function test_list_estates_search_by_title(): void
    {
        $unique = 'UniqueSearchTerm' . uniqid();
        $estate = $this->createEstate(['title' => $unique]);

        $response = $this->actingAs($this->agentUser())
            ->get('/estates', ['q' => $unique]);

        $response->assertOk();
        $data = $response->json()['data'] ?? [];
        $this->assertNotEmpty($data);
        $this->assertEquals($unique, $data[0]['title']);

        $estate->delete();
    }

    public function test_unauthenticated_cannot_list_estates(): void
    {
        $this->get('/estates')->assertUnauthorized();
    }
}
```

**Step 2: Run test to verify it fails**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_agent_can_list_estates -v`
Expected: FAIL — route `/estates` has no controller

**Step 3: Write the controller and register route**

Create `app/Controllers/Estate/EstateListController.php`:

```php
<?php

namespace App\Controllers\Estate;

use BaseApi\Controllers\Controller;
use BaseApi\Http\ControllerListHelpers;
use BaseApi\Http\JsonResponse;
use App\Models\Estate;

class EstateListController extends Controller
{
    public function get(): JsonResponse
    {
        $query = Estate::query();

        // Apply filters
        $filters = [
            'status'         => fn ($q, $v) => $q->where('status', '=', $v),
            'property_type'  => fn ($q, $v) => $q->where('property_type', '=', $v),
            'marketing_type' => fn ($q, $v) => $q->where('marketing_type', '=', $v),
            'city'           => fn ($q, $v) => $q->where('city', '=', $v),
            'assigned_user_id' => fn ($q, $v) => $q->where('assigned_user_id', '=', $v),
            'office_id'      => fn ($q, $v) => $q->where('office_id', '=', $v),
        ];

        foreach ($filters as $param => $apply) {
            $value = $this->request->query[$param] ?? null;
            if ($value !== null && $value !== '') {
                $query = $apply($query, $value);
            }
        }

        // Price range
        $priceMin = $this->request->query['price_min'] ?? null;
        if ($priceMin !== null && $priceMin !== '') {
            $query = $query->where('price', '>=', (float) $priceMin);
        }
        $priceMax = $this->request->query['price_max'] ?? null;
        if ($priceMax !== null && $priceMax !== '') {
            $query = $query->where('price', '<=', (float) $priceMax);
        }

        // Quick search (title, external_id, city)
        $search = $this->request->query['q'] ?? null;
        if ($search !== null && $search !== '') {
            $query = $query->whereRaw(
                "(title LIKE ? OR external_id LIKE ? OR city LIKE ?)",
                ["%{$search}%", "%{$search}%", "%{$search}%"],
            );
        }

        [$query, $page, $perPage] = ControllerListHelpers::applyListParams(
            $query,
            $this->request,
            50,
        );

        $result = $query->paginate($page, $perPage, 50, true);

        return JsonResponse::paginated($result);
    }
}
```

Add route to `routes/api.php` — insert in an Estate section after Office endpoints:

```php
use App\Controllers\Estate\EstateListController;

// ================================
// Estate Endpoints
// ================================

$router->get('/estates', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateListController::class,
]);
```

**Step 4: Run list tests to verify they pass**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_agent_can_list -v`
Expected: PASS

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_list_ -v`
Expected: PASS (all filter tests)

**Step 5: Commit**

```bash
git add app/Controllers/Estate/EstateListController.php tests/Feature/EstateCrudTest.php routes/api.php
git commit -m "feat: add estate list controller with filters"
```

**Note:** The `whereRaw` method may not exist on BaseAPI's QueryBuilder. If so, implement search using individual `where` + `orWhere` chains, or check if the framework supports `whereGroup` / raw clauses. Adjust accordingly at implementation time.

---

### Task 2: EstateShowController

**Files:**
- Create: `app/Controllers/Estate/EstateShowController.php`
- Modify: `routes/api.php` — add show route
- Modify: `tests/Feature/EstateCrudTest.php` — add show tests

**Step 1: Add failing tests to `EstateCrudTest.php`**

```php
    // --- Show ---

    public function test_agent_can_show_estate(): void
    {
        $estate = $this->createEstate();

        $response = $this->actingAs($this->agentUser())
            ->get('/estates/' . $estate->id);

        $response->assertOk();
        $response->assertJsonPath('data.id', $estate->id);
        $response->assertJsonPath('data.title', $estate->title);

        $estate->delete();
    }

    public function test_show_estate_includes_relations(): void
    {
        $estate = $this->createEstate();

        $response = $this->actingAs($this->agentUser())
            ->get('/estates/' . $estate->id);

        $response->assertOk();
        // Should include property_type, marketing_type, status at minimum
        $data = $response->json()['data'] ?? [];
        $this->assertArrayHasKey('property_type', $data);
        $this->assertArrayHasKey('marketing_type', $data);
        $this->assertArrayHasKey('status', $data);

        $estate->delete();
    }

    public function test_show_nonexistent_estate_returns_404(): void
    {
        $this->actingAs($this->agentUser())
            ->get('/estates/nonexistent-id')
            ->assertNotFound();
    }
```

**Step 2: Run test to verify it fails**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_agent_can_show_estate -v`
Expected: FAIL — no route

**Step 3: Write the controller and route**

Create `app/Controllers/Estate/EstateShowController.php`:

```php
<?php

namespace App\Controllers\Estate;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use App\Models\Estate;

class EstateShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $estate = Estate::with(['images'])->where('id', '=', $this->id)->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        return JsonResponse::ok($estate->toArray(true));
    }
}
```

Add route to `routes/api.php`:

```php
use App\Controllers\Estate\EstateShowController;

$router->get('/estates/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateShowController::class,
]);
```

**Step 4: Run tests**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_.*show -v`
Expected: PASS

**Step 5: Commit**

```bash
git add app/Controllers/Estate/EstateShowController.php tests/Feature/EstateCrudTest.php routes/api.php
git commit -m "feat: add estate show controller with eager-loaded images"
```

---

### Task 3: EstateCreateController

**Files:**
- Create: `app/Controllers/Estate/EstateCreateController.php`
- Modify: `routes/api.php` — add create route
- Modify: `tests/Feature/EstateCrudTest.php` — add create tests

**Step 1: Add failing tests**

```php
    // --- Create ---

    public function test_agent_can_create_estate(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->post('/estates', [
                'title' => 'New Estate ' . uniqid(),
                'property_type' => 'apartment',
                'marketing_type' => 'sale',
            ]);

        $response->assertCreated();
        $response->assertJsonHas('data');
        $data = $response->json()['data'];
        $this->assertEquals('draft', $data['status']);
        $this->assertEquals('agent-user-id', $data['assigned_user_id']);

        // Clean up
        $estate = Estate::find($data['id']);
        $estate?->delete();
    }

    public function test_create_estate_requires_title(): void
    {
        $this->actingAs($this->agentUser())
            ->post('/estates', [
                'property_type' => 'apartment',
                'marketing_type' => 'sale',
            ])
            ->assertStatus(422);
    }

    public function test_create_estate_validates_property_type(): void
    {
        $this->actingAs($this->agentUser())
            ->post('/estates', [
                'title' => 'Bad Type ' . uniqid(),
                'property_type' => 'spaceship',
                'marketing_type' => 'sale',
            ])
            ->assertStatus(422);
    }

    public function test_create_estate_validates_marketing_type(): void
    {
        $this->actingAs($this->agentUser())
            ->post('/estates', [
                'title' => 'Bad Marketing ' . uniqid(),
                'property_type' => 'apartment',
                'marketing_type' => 'barter',
            ])
            ->assertStatus(422);
    }

    public function test_create_estate_with_full_details(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->post('/estates', [
                'title' => 'Full Estate ' . uniqid(),
                'property_type' => 'house',
                'marketing_type' => 'sale',
                'description' => 'A lovely house',
                'street' => 'Main St',
                'house_number' => '42',
                'zip' => '10115',
                'city' => 'Berlin',
                'country' => 'DE',
                'price' => 350000,
                'rooms' => 5,
                'area_living' => 120.5,
            ]);

        $response->assertCreated();
        $data = $response->json()['data'];
        $this->assertEquals('Berlin', $data['city']);
        $this->assertEquals(350000, $data['price']);
        $this->assertEquals(5, $data['rooms']);

        Estate::find($data['id'])?->delete();
    }
```

**Step 2: Run test to verify it fails**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_agent_can_create_estate -v`
Expected: FAIL

**Step 3: Write the controller and route**

Create `app/Controllers/Estate/EstateCreateController.php`:

```php
<?php

namespace App\Controllers\Estate;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;
use App\Models\Estate;
use App\Services\AuditLogService;

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
    public ?string $office_id = null;

    private const array PROPERTY_TYPES = ['apartment', 'house', 'commercial', 'land', 'garage'];
    private const array MARKETING_TYPES = ['sale', 'rent', 'lease'];

    public function post(): JsonResponse
    {
        $this->validate([
            'title'          => 'required|string|max:255',
            'property_type'  => 'required|string|in:' . implode(',', self::PROPERTY_TYPES),
            'marketing_type' => 'required|string|in:' . implode(',', self::MARKETING_TYPES),
        ]);

        $estate = new Estate();
        $estate->title          = $this->title;
        $estate->property_type  = $this->property_type;
        $estate->marketing_type = $this->marketing_type;
        $estate->status         = 'draft';

        // Assign to current user
        $estate->assigned_user_id = $this->request->user['id'];
        $estate->office_id        = $this->office_id ?? $this->request->user['office_id'] ?? null;

        // Optional fields
        $estate->description    = $this->description;
        $estate->external_id    = $this->external_id;
        $estate->street         = $this->street;
        $estate->house_number   = $this->house_number;
        $estate->zip            = $this->zip;
        $estate->city           = $this->city;
        $estate->country        = $this->country;
        $estate->latitude       = $this->latitude;
        $estate->longitude      = $this->longitude;
        $estate->price          = $this->price;
        $estate->area_total     = $this->area_total;
        $estate->area_living    = $this->area_living;
        $estate->area_plot      = $this->area_plot;
        $estate->rooms          = $this->rooms;
        $estate->bedrooms       = $this->bedrooms;
        $estate->bathrooms      = $this->bathrooms;
        $estate->floor          = $this->floor;
        $estate->floors_total   = $this->floors_total;
        $estate->year_built     = $this->year_built;
        $estate->parking_spaces = $this->parking_spaces;
        $estate->heating_type   = $this->heating_type;
        $estate->energy_rating  = $this->energy_rating;
        $estate->condition      = $this->condition;
        $estate->furnished      = $this->furnished;
        $estate->balcony        = $this->balcony;
        $estate->garden         = $this->garden;
        $estate->elevator       = $this->elevator;
        $estate->cellar         = $this->cellar;
        $estate->virtual_tour_url    = $this->virtual_tour_url;
        $estate->owner_contact_id   = $this->owner_contact_id;

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
        );

        return JsonResponse::created($estate->toArray());
    }
}
```

Add route:

```php
use App\Controllers\Estate\EstateCreateController;

$router->post('/estates', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateCreateController::class,
]);
```

**Step 4: Run tests**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_.*create -v`
Expected: PASS

**Step 5: Commit**

```bash
git add app/Controllers/Estate/EstateCreateController.php tests/Feature/EstateCrudTest.php routes/api.php
git commit -m "feat: add estate create controller with validation and audit log"
```

---

### Task 4: EstateUpdateController

**Files:**
- Create: `app/Controllers/Estate/EstateUpdateController.php`
- Modify: `routes/api.php` — add update route
- Modify: `tests/Feature/EstateCrudTest.php` — add update tests

**Step 1: Add failing tests**

```php
    // --- Update ---

    public function test_agent_can_update_own_estate(): void
    {
        $estate = $this->createEstate(['assigned_user_id' => 'agent-user-id']);

        $response = $this->actingAs($this->agentUser())
            ->patch('/estates/' . $estate->id, [
                'title' => 'Updated Title',
                'price' => 250000,
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.title', 'Updated Title');
        $response->assertJsonPath('data.price', 250000);

        $estate->delete();
    }

    public function test_admin_can_update_any_estate(): void
    {
        $estate = $this->createEstate(['assigned_user_id' => 'other-user-id']);

        $response = $this->actingAs($this->adminUser())
            ->patch('/estates/' . $estate->id, [
                'title' => 'Admin Updated',
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.title', 'Admin Updated');

        $estate->delete();
    }

    public function test_admin_can_change_estate_status(): void
    {
        $estate = $this->createEstate(['status' => 'draft']);

        $response = $this->actingAs($this->adminUser())
            ->patch('/estates/' . $estate->id, ['status' => 'active']);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'active');

        $estate->delete();
    }

    public function test_update_validates_status_transition(): void
    {
        $estate = $this->createEstate(['status' => 'draft']);

        $this->actingAs($this->adminUser())
            ->patch('/estates/' . $estate->id, ['status' => 'invalid_status'])
            ->assertStatus(422);

        $estate->delete();
    }

    public function test_update_nonexistent_estate_returns_404(): void
    {
        $this->actingAs($this->adminUser())
            ->patch('/estates/nonexistent-id', ['title' => 'Nope'])
            ->assertNotFound();
    }
```

**Step 2: Run test to verify it fails**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_agent_can_update -v`
Expected: FAIL

**Step 3: Write the controller and route**

Create `app/Controllers/Estate/EstateUpdateController.php`:

```php
<?php

namespace App\Controllers\Estate;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;
use App\Models\Estate;
use App\Services\AuditLogService;

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
        'virtual_tour_url', 'owner_contact_id', 'assigned_user_id', 'office_id',
    ];

    public function patch(): JsonResponse
    {
        $estate = Estate::find($this->id);

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        // Validate enum fields if provided
        if ($this->property_type !== null) {
            $this->validate(['property_type' => 'string|in:' . implode(',', self::PROPERTY_TYPES)]);
        }
        if ($this->marketing_type !== null) {
            $this->validate(['marketing_type' => 'string|in:' . implode(',', self::MARKETING_TYPES)]);
        }
        if ($this->status !== null) {
            $this->validate(['status' => 'string|in:' . implode(',', self::VALID_STATUSES)]);
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

        $estate->save();

        // Compute diff for audit
        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $estate->{$field};
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, self::PATCHABLE_FIELDS);

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'estate',
            $estate->id,
            $changes,
            ClientIp::from($this->request, true),
        );

        return JsonResponse::ok($estate->toArray());
    }
}
```

Add route:

```php
use App\Controllers\Estate\EstateUpdateController;

$router->patch('/estates/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateUpdateController::class,
]);
```

**Step 4: Run tests**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_.*update -v`
Expected: PASS

**Step 5: Commit**

```bash
git add app/Controllers/Estate/EstateUpdateController.php tests/Feature/EstateCrudTest.php routes/api.php
git commit -m "feat: add estate update controller with audit logging"
```

---

### Task 5: EstateDeleteController

**Files:**
- Create: `app/Controllers/Estate/EstateDeleteController.php`
- Modify: `routes/api.php` — add delete route
- Modify: `tests/Feature/EstateCrudTest.php` — add delete tests

**Step 1: Add failing tests**

```php
    // --- Delete ---

    public function test_admin_can_delete_estate(): void
    {
        $estate = $this->createEstate();

        $response = $this->actingAs($this->adminUser())
            ->delete('/estates/' . $estate->id);

        $response->assertOk();

        // Verify archived
        $archived = Estate::find($estate->id);
        $this->assertEquals('archived', $archived->status);

        $archived->delete();
    }

    public function test_agent_cannot_delete_estate(): void
    {
        $estate = $this->createEstate();

        $this->actingAs($this->agentUser())
            ->delete('/estates/' . $estate->id)
            ->assertForbidden();

        $estate->delete();
    }

    public function test_delete_nonexistent_estate_returns_404(): void
    {
        $this->actingAs($this->adminUser())
            ->delete('/estates/nonexistent-id')
            ->assertNotFound();
    }

    public function test_delete_already_archived_estate_returns_404(): void
    {
        $estate = $this->createEstate(['status' => 'archived']);

        $this->actingAs($this->adminUser())
            ->delete('/estates/' . $estate->id)
            ->assertNotFound();

        $estate->delete();
    }
```

**Step 2: Run test to verify it fails**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_admin_can_delete -v`
Expected: FAIL

**Step 3: Write the controller and route**

Create `app/Controllers/Estate/EstateDeleteController.php`:

```php
<?php

namespace App\Controllers\Estate;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Support\ClientIp;
use App\Models\Estate;
use App\Services\AuditLogService;

class EstateDeleteController extends Controller
{
    public string $id = '';

    public function delete(): JsonResponse
    {
        $estate = Estate::find($this->id);

        if (!$estate instanceof Estate || $estate->status === 'archived') {
            return JsonResponse::notFound('Estate not found');
        }

        $oldStatus = $estate->status;
        $estate->status = 'archived';
        $estate->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'deleted',
            'estate',
            $estate->id,
            ['status' => ['old' => $oldStatus, 'new' => 'archived']],
            ClientIp::from($this->request, true),
        );

        return JsonResponse::ok(['message' => 'Estate archived']);
    }
}
```

Add route — note delete requires `admin` or `manager` role:

```php
use App\Controllers\Estate\EstateDeleteController;

$router->delete('/estates/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['manager']],
    EstateDeleteController::class,
]);
```

**Step 4: Run tests**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php --filter test_.*delete -v`
Expected: PASS

**Step 5: Commit**

```bash
git add app/Controllers/Estate/EstateDeleteController.php tests/Feature/EstateCrudTest.php routes/api.php
git commit -m "feat: add estate delete controller (soft-delete via archive)"
```

---

### Task 6: Run full test suite and clean up

**Step 1: Run all estate tests**

Run: `composer phpunit -- tests/Feature/EstateCrudTest.php -v`
Expected: All tests PASS

**Step 2: Run full test suite to check for regressions**

Run: `composer phpunit`
Expected: All tests PASS

**Step 3: Run static analysis**

Run: `composer phpstan`
Expected: No new errors (or update baseline with `composer phpstan-baseline`)

**Step 4: Run rector**

Run: `composer rector`
Expected: No issues (or fix with `composer rector:fix`)

**Step 5: Delete scaffolding files**

Delete `app/Models/Test.php` and `app/Controllers/TestController.php` — they're unused scaffolding templates.

**Step 6: Final commit**

```bash
git rm app/Models/Test.php app/Controllers/TestController.php
git add -A
git commit -m "chore: remove scaffolding templates, clean up"
```
