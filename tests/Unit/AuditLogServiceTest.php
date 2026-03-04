<?php

namespace App\Tests\Unit;

use App\Services\AuditLogService;
use PHPUnit\Framework\TestCase;

class AuditLogServiceTest extends TestCase
{
    public function test_compute_changes_detects_changed_fields(): void
    {
        $old = ['name' => 'Old Name', 'email' => 'old@example.com'];
        $new = ['name' => 'New Name', 'email' => 'old@example.com'];

        $changes = AuditLogService::computeChanges($old, $new, ['name', 'email']);

        $this->assertCount(1, $changes);
        $this->assertArrayHasKey('name', $changes);
        $this->assertEquals('Old Name', $changes['name']['old']);
        $this->assertEquals('New Name', $changes['name']['new']);
    }

    public function test_compute_changes_ignores_unchanged_fields(): void
    {
        $old = ['name' => 'Same', 'email' => 'same@example.com'];
        $new = ['name' => 'Same', 'email' => 'same@example.com'];

        $changes = AuditLogService::computeChanges($old, $new, ['name', 'email']);

        $this->assertEmpty($changes);
    }

    public function test_compute_changes_handles_null_values(): void
    {
        $old = ['phone' => null];
        $new = ['phone' => '123-456'];

        $changes = AuditLogService::computeChanges($old, $new, ['phone']);

        $this->assertCount(1, $changes);
        $this->assertNull($changes['phone']['old']);
        $this->assertEquals('123-456', $changes['phone']['new']);
    }

    public function test_compute_changes_handles_null_to_null(): void
    {
        $old = ['phone' => null];
        $new = ['phone' => null];

        $changes = AuditLogService::computeChanges($old, $new, ['phone']);

        $this->assertEmpty($changes);
    }

    public function test_compute_changes_respects_tracked_fields_filter(): void
    {
        $old = ['name' => 'Old', 'email' => 'old@example.com', 'phone' => '111'];
        $new = ['name' => 'New', 'email' => 'new@example.com', 'phone' => '222'];

        // Only track name
        $changes = AuditLogService::computeChanges($old, $new, ['name']);

        $this->assertCount(1, $changes);
        $this->assertArrayHasKey('name', $changes);
        $this->assertArrayNotHasKey('email', $changes);
        $this->assertArrayNotHasKey('phone', $changes);
    }

    public function test_compute_changes_handles_missing_keys(): void
    {
        $old = ['name' => 'Old'];
        $new = [];

        $changes = AuditLogService::computeChanges($old, $new, ['name']);

        $this->assertCount(1, $changes);
        $this->assertEquals('Old', $changes['name']['old']);
        $this->assertNull($changes['name']['new']);
    }

    public function test_compute_changes_empty_tracked_fields(): void
    {
        $old = ['name' => 'Old'];
        $new = ['name' => 'New'];

        $changes = AuditLogService::computeChanges($old, $new, []);

        $this->assertEmpty($changes);
    }
}
