<?php

namespace App\Tests\Feature;

use BaseApi\Testing\TestCase;
use App\Models\Office;
use App\Models\User;

class UserManagementTest extends TestCase
{
    private ?Office $office1 = null;
    private ?Office $office2 = null;

    /** @var array<string> */
    private array $createdUserIds = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->office1 = $this->createOffice('Office 1 ' . uniqid());
        $this->office2 = $this->createOffice('Office 2 ' . uniqid());
    }

    protected function tearDown(): void
    {
        foreach ($this->createdUserIds as $id) {
            $user = User::find($id);
            $user?->delete();
        }
        $this->office1?->delete();
        $this->office2?->delete();
        parent::tearDown();
    }

    private function createOffice(string $name): Office
    {
        $office = new Office();
        $office->name = $name;
        $office->save();

        return $office;
    }

    private function createUser(array $data): User
    {
        $user = new User();
        $user->name = $data['name'] ?? 'Test User';
        $user->email = $data['email'] ?? (uniqid() . '@test.com');
        $user->password = password_hash($data['password'] ?? 'password123', PASSWORD_DEFAULT);
        $user->role = $data['role'] ?? 'agent';
        $user->office_id = $data['office_id'] ?? null;
        $user->save();

        $this->createdUserIds[] = $user->id;

        return $user;
    }

    private function adminUser(array $overrides = []): array
    {
        return array_merge([
            'id' => 'admin-id-' . uniqid(),
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'role' => 'admin',
            'office_id' => $this->office1->id,
        ], $overrides);
    }

    private function managerUser(array $overrides = []): array
    {
        return array_merge([
            'id' => 'manager-id-' . uniqid(),
            'name' => 'Manager',
            'email' => 'manager@test.com',
            'role' => 'manager',
            'office_id' => $this->office1->id,
        ], $overrides);
    }

    // ---- List scoping ----

    public function test_admin_sees_all_users(): void
    {
        $user1 = $this->createUser(['office_id' => $this->office1->id]);
        $user2 = $this->createUser(['office_id' => $this->office2->id]);

        $response = $this->actingAs($this->adminUser())
            ->get('/users');

        $response->assertOk();
        $items = $response->json()['items'] ?? [];

        $ids = array_column($items, 'id');
        $this->assertContains($user1->id, $ids);
        $this->assertContains($user2->id, $ids);
    }

    public function test_manager_sees_only_own_office_users(): void
    {
        $user1 = $this->createUser(['office_id' => $this->office1->id]);
        $user2 = $this->createUser(['office_id' => $this->office2->id]);

        $response = $this->actingAs($this->managerUser())
            ->get('/users');

        $response->assertOk();
        $items = $response->json()['items'] ?? [];

        $ids = array_column($items, 'id');
        $this->assertContains($user1->id, $ids);
        $this->assertNotContains($user2->id, $ids);
    }

    // ---- Self-view ----

    public function test_any_authenticated_user_can_view_self(): void
    {
        $user = $this->createUser(['role' => 'agent', 'office_id' => $this->office1->id]);

        $response = $this->actingAs([
            'id' => $user->id,
            'role' => 'agent',
            'office_id' => $this->office1->id,
        ])->get('/users/' . $user->id);

        $response->assertOk();
        $response->assertJsonPath('id', $user->id);
    }

    // ---- Create ----

    public function test_admin_can_create_user(): void
    {
        $email = uniqid() . '@test.com';

        $response = $this->actingAs($this->adminUser())
            ->post('/users', [
                'name' => 'New User',
                'email' => $email,
                'password' => 'password123',
                'role' => 'agent',
                'office_id' => $this->office1->id,
            ]);

        $response->assertCreated();
        $response->assertJsonPath('email', $email);

        // Track for cleanup
        $id = $response->json()['id'] ?? null;
        if ($id) {
            $this->createdUserIds[] = $id;
        }
    }

    // ---- Self-update restrictions ----

    public function test_self_update_allows_only_permitted_fields(): void
    {
        $user = $this->createUser([
            'name' => 'Original',
            'role' => 'agent',
            'office_id' => $this->office1->id,
        ]);

        // Try to update role (should be ignored for self-update as agent)
        $response = $this->actingAs([
            'id' => $user->id,
            'role' => 'agent',
            'office_id' => $this->office1->id,
        ])->patch('/users/' . $user->id, [
            'name' => 'Updated Name',
            'role' => 'admin',
        ]);

        $response->assertOk();
        $response->assertJsonPath('name', 'Updated Name');

        // Role should not have changed
        $refreshed = User::find($user->id);
        $this->assertEquals('agent', $refreshed->role);
    }

    // ---- Manager cross-office denied ----

    public function test_manager_cannot_update_user_from_other_office(): void
    {
        $user = $this->createUser([
            'office_id' => $this->office2->id,
        ]);

        $response = $this->actingAs($this->managerUser())
            ->patch('/users/' . $user->id, ['name' => 'Hacked']);

        $response->assertForbidden();
    }

    // ---- Admin cannot deactivate self ----

    public function test_admin_cannot_deactivate_self(): void
    {
        $adminId = 'self-admin-' . uniqid();

        $response = $this->actingAs($this->adminUser(['id' => $adminId]))
            ->delete('/users/' . $adminId);

        $response->assertBadRequest();
    }

    // ---- Password not in output ----

    public function test_user_list_strips_passwords(): void
    {
        $this->createUser(['office_id' => $this->office1->id]);

        $response = $this->actingAs($this->adminUser())
            ->get('/users');

        $response->assertOk();
        $items = $response->json()['items'] ?? [];

        foreach ($items as $item) {
            $this->assertArrayNotHasKey('password', $item);
        }
    }

    // ---- View user shows no password ----

    public function test_view_user_strips_password(): void
    {
        $user = $this->createUser(['office_id' => $this->office1->id]);

        $response = $this->actingAs($this->adminUser())
            ->get('/users/' . $user->id);

        $response->assertOk();
        $json = $response->json();
        $this->assertArrayNotHasKey('password', $json);
    }
}
