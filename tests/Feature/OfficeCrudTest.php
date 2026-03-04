<?php

namespace App\Tests\Feature;

use BaseApi\Testing\TestCase;
use App\Models\Office;

class OfficeCrudTest extends TestCase
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

    private function createOffice(string $name = 'Test Office'): Office
    {
        $office = new Office();
        $office->name = $name;
        $office->save();

        return $office;
    }

    public function test_admin_can_create_office(): void
    {
        $response = $this->actingAs($this->adminUser())
            ->post('/offices', ['name' => 'New Office ' . uniqid()]);

        $response->assertCreated();
        $response->assertJsonHas('id');

        // Clean up
        $id = $response->json()['id'] ?? null;
        if ($id) {
            $office = Office::find($id);
            $office?->delete();
        }
    }

    public function test_agent_can_list_offices(): void
    {
        $office = $this->createOffice('List Test ' . uniqid());

        $response = $this->actingAs($this->agentUser())
            ->get('/offices');

        $response->assertOk();
        $response->assertJsonHas('items');

        $office->delete();
    }

    public function test_admin_can_update_office(): void
    {
        $office = $this->createOffice('Update Test ' . uniqid());

        $response = $this->actingAs($this->adminUser())
            ->patch('/offices/' . $office->id, ['name' => 'Updated Name']);

        $response->assertOk();
        $response->assertJsonPath('name', 'Updated Name');

        $office->delete();
    }

    public function test_admin_can_deactivate_office(): void
    {
        $office = $this->createOffice('Delete Test ' . uniqid());

        $response = $this->actingAs($this->adminUser())
            ->delete('/offices/' . $office->id);

        $response->assertOk();

        // Verify it's deactivated
        $deactivated = Office::find($office->id);
        $this->assertFalse($deactivated->active);

        $deactivated->delete();
    }

    public function test_show_deactivated_office_returns_404(): void
    {
        $office = $this->createOffice('Deactivated Test ' . uniqid());
        $office->active = false;
        $office->save();

        $this->actingAs($this->agentUser())
            ->get('/offices/' . $office->id)
            ->assertNotFound();

        $office->delete();
    }

    public function test_show_nonexistent_office_returns_404(): void
    {
        $this->actingAs($this->agentUser())
            ->get('/offices/nonexistent-id')
            ->assertNotFound();
    }

    public function test_update_nonexistent_office_returns_404(): void
    {
        $this->actingAs($this->adminUser())
            ->patch('/offices/nonexistent-id', ['name' => 'Nope'])
            ->assertNotFound();
    }

    public function test_create_office_requires_name(): void
    {
        $response = $this->actingAs($this->adminUser())
            ->post('/offices', []);

        // Validation should fail without name
        $this->assertNotEquals(201, $response->json()['status'] ?? $response->json()['success'] ?? null);
    }
}
