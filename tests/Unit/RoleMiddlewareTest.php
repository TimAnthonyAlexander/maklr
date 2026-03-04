<?php

namespace App\Tests\Unit;

use App\Middleware\RoleMiddleware;
use PHPUnit\Framework\TestCase;

class RoleMiddlewareTest extends TestCase
{
    public function test_admin_passes_any_role_check(): void
    {
        $this->assertTrue(RoleMiddleware::hasRequiredRole('admin', ['agent']));
        $this->assertTrue(RoleMiddleware::hasRequiredRole('admin', ['manager']));
        $this->assertTrue(RoleMiddleware::hasRequiredRole('admin', ['admin']));
        $this->assertTrue(RoleMiddleware::hasRequiredRole('admin', ['guest']));
    }

    public function test_guest_fails_manager_check(): void
    {
        $this->assertFalse(RoleMiddleware::hasRequiredRole('guest', ['manager']));
    }

    public function test_guest_fails_agent_check(): void
    {
        $this->assertFalse(RoleMiddleware::hasRequiredRole('guest', ['agent']));
    }

    public function test_agent_passes_agent_check(): void
    {
        $this->assertTrue(RoleMiddleware::hasRequiredRole('agent', ['agent']));
    }

    public function test_manager_passes_agent_check(): void
    {
        $this->assertTrue(RoleMiddleware::hasRequiredRole('manager', ['agent']));
    }

    public function test_agent_fails_manager_check(): void
    {
        $this->assertFalse(RoleMiddleware::hasRequiredRole('agent', ['manager']));
    }

    public function test_empty_roles_passes_all(): void
    {
        $this->assertTrue(RoleMiddleware::hasRequiredRole('guest', []));
        $this->assertTrue(RoleMiddleware::hasRequiredRole('admin', []));
    }

    public function test_unknown_role_has_level_zero(): void
    {
        $this->assertFalse(RoleMiddleware::hasRequiredRole('unknown', ['guest']));
    }

    public function test_unknown_role_passes_empty_roles(): void
    {
        $this->assertTrue(RoleMiddleware::hasRequiredRole('unknown', []));
    }

    public function test_role_hierarchy_ordering(): void
    {
        $roles = ['guest', 'api_user', 'readonly', 'agent', 'manager', 'admin'];

        for ($i = 0; $i < count($roles); $i++) {
            // Each role should pass its own level check
            $this->assertTrue(
                RoleMiddleware::hasRequiredRole($roles[$i], [$roles[$i]]),
                "{$roles[$i]} should pass {$roles[$i]} check",
            );

            // Each role should fail checks for higher roles
            for ($j = $i + 1; $j < count($roles); $j++) {
                $this->assertFalse(
                    RoleMiddleware::hasRequiredRole($roles[$i], [$roles[$j]]),
                    "{$roles[$i]} should fail {$roles[$j]} check",
                );
            }
        }
    }
}
