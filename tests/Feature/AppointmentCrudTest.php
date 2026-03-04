<?php

namespace App\Tests\Feature;

use App\Models\Appointment;
use App\Models\AppointmentUser;
use App\Models\Office;
use App\Models\User;
use BaseApi\Testing\TestCase;

class AppointmentCrudTest extends TestCase
{
    private ?Office $office = null;

    private ?User $agentUserModel = null;

    private ?User $managerUserModel = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->office = new Office();
        $this->office->name = 'Test Office ' . uniqid();
        $this->office->save();

        $this->agentUserModel = new User();
        $this->agentUserModel->name = 'Agent User';
        $this->agentUserModel->email = uniqid() . '@agent.test';
        $this->agentUserModel->password = password_hash('pass', PASSWORD_DEFAULT);
        $this->agentUserModel->role = 'agent';
        $this->agentUserModel->office_id = $this->office->id;
        $this->agentUserModel->save();

        $this->managerUserModel = new User();
        $this->managerUserModel->name = 'Manager User';
        $this->managerUserModel->email = uniqid() . '@manager.test';
        $this->managerUserModel->password = password_hash('pass', PASSWORD_DEFAULT);
        $this->managerUserModel->role = 'manager';
        $this->managerUserModel->office_id = $this->office->id;
        $this->managerUserModel->save();
    }

    protected function tearDown(): void
    {
        // Clean up appointments
        $appointments = Appointment::where('office_id', '=', $this->office?->id)->get();
        foreach ($appointments as $appointment) {
            $users = AppointmentUser::where('appointment_id', '=', $appointment->id)->get();
            foreach ($users as $user) {
                $user->delete();
            }
            $appointment->delete();
        }

        $this->agentUserModel?->delete();
        $this->managerUserModel?->delete();
        $this->office?->delete();

        parent::tearDown();
    }

    private function agentUser(): array
    {
        return [
            'id' => $this->agentUserModel->id,
            'name' => $this->agentUserModel->name,
            'email' => $this->agentUserModel->email,
            'role' => 'agent',
            'office_id' => $this->office->id,
        ];
    }

    private function managerUser(): array
    {
        return [
            'id' => $this->managerUserModel->id,
            'name' => $this->managerUserModel->name,
            'email' => $this->managerUserModel->email,
            'role' => 'manager',
            'office_id' => $this->office->id,
        ];
    }

    public function test_agent_can_create_appointment(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'Test Viewing',
                'type' => 'viewing',
                'starts_at' => '2026-03-10 10:00:00',
                'ends_at' => '2026-03-10 11:00:00',
            ]);

        $response->assertCreated();
        $response->assertJsonHas('id');
        $response->assertJsonPath('title', 'Test Viewing');
        $response->assertJsonPath('type', 'viewing');
    }

    public function test_create_appointment_requires_title(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'type' => 'meeting',
                'starts_at' => '2026-03-10 10:00:00',
                'ends_at' => '2026-03-10 11:00:00',
            ]);

        $response->assertStatus(422);
    }

    public function test_create_appointment_validates_type(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'Bad Type',
                'type' => 'invalid_type',
                'starts_at' => '2026-03-10 10:00:00',
                'ends_at' => '2026-03-10 11:00:00',
            ]);

        $response->assertStatus(422);
    }

    public function test_agent_can_list_appointments(): void
    {
        $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'List Test',
                'type' => 'meeting',
                'starts_at' => '2026-03-10 09:00:00',
                'ends_at' => '2026-03-10 10:00:00',
            ]);

        $response = $this->actingAs($this->agentUser())
            ->get('/appointments');

        $response->assertOk();
        $response->assertJsonHas('items');
    }

    public function test_list_appointments_filters_by_date_range(): void
    {
        $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'March Appointment',
                'type' => 'meeting',
                'starts_at' => '2026-03-15 10:00:00',
                'ends_at' => '2026-03-15 11:00:00',
            ]);

        $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'April Appointment',
                'type' => 'meeting',
                'starts_at' => '2026-04-15 10:00:00',
                'ends_at' => '2026-04-15 11:00:00',
            ]);

        $response = $this->actingAs($this->agentUser())
            ->get('/appointments', [
                'starts_after' => '2026-03-01',
                'starts_before' => '2026-03-31',
            ]);

        $response->assertOk();
        $items = $response->json()['items'] ?? [];
        foreach ($items as $item) {
            $this->assertGreaterThanOrEqual('2026-03-01', $item['starts_at']);
            $this->assertLessThanOrEqual('2026-03-31', $item['starts_at']);
        }
    }

    public function test_agent_can_show_appointment(): void
    {
        $createResponse = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'Show Test',
                'type' => 'viewing',
                'starts_at' => '2026-03-10 14:00:00',
                'ends_at' => '2026-03-10 15:00:00',
            ]);

        $id = $createResponse->json()['id'] ?? null;
        $this->assertNotNull($id);

        $response = $this->actingAs($this->agentUser())
            ->get('/appointments/' . $id);

        $response->assertOk();
        $response->assertJsonPath('title', 'Show Test');
    }

    public function test_show_nonexistent_appointment_returns_404(): void
    {
        $this->actingAs($this->agentUser())
            ->get('/appointments/nonexistent-id')
            ->assertNotFound();
    }

    public function test_agent_can_update_appointment(): void
    {
        $createResponse = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'Update Test',
                'type' => 'meeting',
                'starts_at' => '2026-03-10 09:00:00',
                'ends_at' => '2026-03-10 10:00:00',
            ]);

        $id = $createResponse->json()['id'] ?? null;
        $this->assertNotNull($id);

        $response = $this->actingAs($this->agentUser())
            ->patch('/appointments/' . $id, [
                'title' => 'Updated Title',
                'location' => 'Office 1',
            ]);

        $response->assertOk();
        $response->assertJsonPath('title', 'Updated Title');
        $response->assertJsonPath('location', 'Office 1');
    }

    public function test_manager_can_delete_appointment(): void
    {
        $createResponse = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'Delete Test',
                'type' => 'meeting',
                'starts_at' => '2026-03-10 16:00:00',
                'ends_at' => '2026-03-10 17:00:00',
            ]);

        $id = $createResponse->json()['id'] ?? null;
        $this->assertNotNull($id);

        $response = $this->actingAs($this->managerUser())
            ->delete('/appointments/' . $id);

        $response->assertNoContent();
    }

    public function test_conflict_detection_returns_warning(): void
    {
        // Create first appointment
        $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'First Meeting',
                'type' => 'meeting',
                'starts_at' => '2026-03-20 10:00:00',
                'ends_at' => '2026-03-20 11:00:00',
            ]);

        // Create overlapping appointment — should save but include conflicts
        $response = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'Overlapping Meeting',
                'type' => 'meeting',
                'starts_at' => '2026-03-20 10:30:00',
                'ends_at' => '2026-03-20 11:30:00',
            ]);

        $response->assertCreated();
        $json = $response->json();
        $this->assertArrayHasKey('conflicts', $json);
        $this->assertNotEmpty($json['conflicts']);
        $this->assertEquals('First Meeting', $json['conflicts'][0]['title']);
    }

    public function test_update_with_overlap_returns_conflict_warning(): void
    {
        // Create two non-overlapping appointments
        $first = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'First',
                'type' => 'meeting',
                'starts_at' => '2026-03-25 10:00:00',
                'ends_at' => '2026-03-25 11:00:00',
            ]);

        $second = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'Second',
                'type' => 'meeting',
                'starts_at' => '2026-03-25 14:00:00',
                'ends_at' => '2026-03-25 15:00:00',
            ]);

        $secondId = $second->json()['id'];

        // Update second to overlap with first
        $response = $this->actingAs($this->agentUser())
            ->patch('/appointments/' . $secondId, [
                'starts_at' => '2026-03-25 10:30:00',
                'ends_at' => '2026-03-25 11:30:00',
            ]);

        $response->assertOk();
        $json = $response->json();
        $this->assertArrayHasKey('conflicts', $json);
        $this->assertNotEmpty($json['conflicts']);
    }

    public function test_adjacent_appointments_do_not_conflict(): void
    {
        // Create first appointment
        $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'First',
                'type' => 'meeting',
                'starts_at' => '2026-03-21 10:00:00',
                'ends_at' => '2026-03-21 11:00:00',
            ]);

        // Create adjacent appointment (starts when first ends)
        $response = $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'Adjacent',
                'type' => 'meeting',
                'starts_at' => '2026-03-21 11:00:00',
                'ends_at' => '2026-03-21 12:00:00',
            ]);

        $response->assertCreated();
    }

    public function test_office_scoping_isolates_appointments(): void
    {
        // Create appointment in office 1
        $this->actingAs($this->agentUser())
            ->post('/appointments', [
                'title' => 'Office 1 Appointment',
                'type' => 'meeting',
                'starts_at' => '2026-03-22 10:00:00',
                'ends_at' => '2026-03-22 11:00:00',
            ]);

        // Different office user should not see it
        $otherOffice = new Office();
        $otherOffice->name = 'Other Office ' . uniqid();
        $otherOffice->save();

        $otherUser = new User();
        $otherUser->name = 'Other Agent';
        $otherUser->email = uniqid() . '@other.test';
        $otherUser->password = password_hash('pass', PASSWORD_DEFAULT);
        $otherUser->role = 'agent';
        $otherUser->office_id = $otherOffice->id;
        $otherUser->save();

        $response = $this->actingAs([
            'id' => $otherUser->id,
            'name' => $otherUser->name,
            'email' => $otherUser->email,
            'role' => 'agent',
            'office_id' => $otherOffice->id,
        ])->get('/appointments');

        $response->assertOk();
        $items = $response->json()['items'] ?? [];
        foreach ($items as $item) {
            $this->assertNotEquals('Office 1 Appointment', $item['title']);
        }

        $otherUser->delete();
        $otherOffice->delete();
    }
}
