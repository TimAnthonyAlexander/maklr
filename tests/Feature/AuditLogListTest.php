<?php

namespace App\Tests\Feature;

use App\Models\AuditLog;
use App\Models\Office;
use App\Models\User;
use BaseApi\Testing\TestCase;

class AuditLogListTest extends TestCase
{
    private ?Office $office = null;

    private ?User $managerUserModel = null;

    private ?User $agentUserModel = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->office = new Office();
        $this->office->name = 'Test Office ' . uniqid();
        $this->office->save();

        $this->managerUserModel = new User();
        $this->managerUserModel->name = 'Manager User';
        $this->managerUserModel->email = uniqid() . '@manager.test';
        $this->managerUserModel->password = password_hash('pass', PASSWORD_DEFAULT);
        $this->managerUserModel->role = 'manager';
        $this->managerUserModel->office_id = $this->office->id;
        $this->managerUserModel->save();

        $this->agentUserModel = new User();
        $this->agentUserModel->name = 'Agent User';
        $this->agentUserModel->email = uniqid() . '@agent.test';
        $this->agentUserModel->password = password_hash('pass', PASSWORD_DEFAULT);
        $this->agentUserModel->role = 'agent';
        $this->agentUserModel->office_id = $this->office->id;
        $this->agentUserModel->save();
    }

    protected function tearDown(): void
    {
        // Clean up audit logs
        $logs = AuditLog::where('office_id', '=', $this->office?->id)->get();
        foreach ($logs as $log) {
            $log->delete();
        }

        $this->agentUserModel?->delete();
        $this->managerUserModel?->delete();
        $this->office?->delete();

        parent::tearDown();
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

    private function createAuditLog(string $action, string $entityType, string $entityId): AuditLog
    {
        $entry = new AuditLog();
        $entry->user_id = $this->managerUserModel->id;
        $entry->action = $action;
        $entry->entity_type = $entityType;
        $entry->entity_id = $entityId;
        $entry->office_id = $this->office->id;
        $entry->setChanges(['test' => ['old' => null, 'new' => 'value']]);
        $entry->save();

        return $entry;
    }

    public function test_db_persistence_via_estate_create(): void
    {
        // Creating an estate should produce an audit log row
        $response = $this->actingAs($this->managerUser())
            ->post('/estates', [
                'title' => 'Audit Test Estate',
                'property_type' => 'apartment',
                'marketing_type' => 'sale',
            ]);

        $response->assertCreated();
        $estateId = $response->json()['id'] ?? null;
        $this->assertNotNull($estateId);

        $log = AuditLog::where('entity_type', '=', 'estate')
            ->where('entity_id', '=', $estateId)
            ->where('action', '=', 'created')
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals($this->managerUserModel->id, $log->user_id);
        $this->assertEquals($this->office->id, $log->office_id);

        // Clean up estate
        $estate = \App\Models\Estate::find($estateId);
        $estate?->delete();
    }

    public function test_list_returns_paginated_results(): void
    {
        $this->createAuditLog('created', 'estate', 'test-id-1');
        $this->createAuditLog('updated', 'contact', 'test-id-2');

        $response = $this->actingAs($this->managerUser())
            ->get('/audit-logs');

        $response->assertOk();
        $json = $response->json();
        $this->assertArrayHasKey('items', $json);
        $this->assertArrayHasKey('pagination', $json);
        $this->assertGreaterThanOrEqual(2, count($json['items']));
    }

    public function test_filter_by_entity_type(): void
    {
        $this->createAuditLog('created', 'estate', 'filter-test-1');
        $this->createAuditLog('created', 'contact', 'filter-test-2');

        $response = $this->actingAs($this->managerUser())
            ->get('/audit-logs', ['entity_type' => 'estate']);

        $response->assertOk();
        $items = $response->json()['items'] ?? [];
        foreach ($items as $item) {
            $this->assertEquals('estate', $item['entity_type']);
        }
    }

    public function test_filter_by_action(): void
    {
        $this->createAuditLog('created', 'estate', 'action-test-1');
        $this->createAuditLog('deleted', 'estate', 'action-test-2');

        $response = $this->actingAs($this->managerUser())
            ->get('/audit-logs', ['action' => 'deleted']);

        $response->assertOk();
        $items = $response->json()['items'] ?? [];
        foreach ($items as $item) {
            $this->assertEquals('deleted', $item['action']);
        }
    }

    public function test_filter_by_date_range(): void
    {
        $entry = $this->createAuditLog('created', 'estate', 'date-test-1');

        $today = date('Y-m-d');

        $response = $this->actingAs($this->managerUser())
            ->get('/audit-logs', ['from' => $today, 'to' => $today]);

        $response->assertOk();
        $items = $response->json()['items'] ?? [];
        $this->assertNotEmpty($items);
    }

    public function test_office_scoping(): void
    {
        $this->createAuditLog('created', 'estate', 'scope-test-1');

        // Create a different office + user
        $otherOffice = new Office();
        $otherOffice->name = 'Other Office ' . uniqid();
        $otherOffice->save();

        $otherUser = new User();
        $otherUser->name = 'Other Manager';
        $otherUser->email = uniqid() . '@other.test';
        $otherUser->password = password_hash('pass', PASSWORD_DEFAULT);
        $otherUser->role = 'manager';
        $otherUser->office_id = $otherOffice->id;
        $otherUser->save();

        $response = $this->actingAs([
            'id' => $otherUser->id,
            'name' => $otherUser->name,
            'email' => $otherUser->email,
            'role' => 'manager',
            'office_id' => $otherOffice->id,
        ])->get('/audit-logs');

        $response->assertOk();
        $items = $response->json()['items'] ?? [];

        foreach ($items as $item) {
            $this->assertNotEquals('scope-test-1', $item['entity_id']);
        }

        $otherUser->delete();
        $otherOffice->delete();
    }

    public function test_requires_permission(): void
    {
        // Agent without audit_logs.read permission should be denied
        $response = $this->actingAs($this->agentUser())
            ->get('/audit-logs');

        $response->assertStatus(403);
    }
}
