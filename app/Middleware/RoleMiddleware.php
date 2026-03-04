<?php

namespace App\Middleware;

use Override;
use BaseApi\Http\Request;
use BaseApi\Http\Response;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Middleware;
use BaseApi\Http\Middleware\OptionedMiddleware;

class RoleMiddleware implements Middleware, OptionedMiddleware
{
    private const array ROLE_LEVELS = [
        'guest' => 1,
        'api_user' => 2,
        'readonly' => 3,
        'agent' => 4,
        'manager' => 5,
        'admin' => 6,
    ];

    private array $options = [];

    #[Override]
    public function setOptions(array $options): void
    {
        $this->options = $options;
    }

    #[Override]
    public function handle(Request $request, callable $next): Response
    {
        $user = $request->user;

        if (!$user) {
            return JsonResponse::unauthorized('Authentication required');
        }

        $allowedRoles = $this->options['roles'] ?? [];

        if ($allowedRoles !== [] && !self::hasRequiredRole($user['role'] ?? 'guest', $allowedRoles)) {
            return JsonResponse::forbidden('Insufficient permissions');
        }

        return $next($request);
    }

    /**
     * Check if a user role meets the minimum level of any allowed role.
     *
     * @param string $userRole The user's current role
     * @param array<string> $allowedRoles Roles that grant access (user must meet or exceed the level of any one)
     */
    public static function hasRequiredRole(string $userRole, array $allowedRoles): bool
    {
        if ($allowedRoles === []) {
            return true;
        }

        $userLevel = self::ROLE_LEVELS[$userRole] ?? 0;

        foreach ($allowedRoles as $allowedRole) {
            $requiredLevel = self::ROLE_LEVELS[$allowedRole] ?? 0;
            if ($userLevel >= $requiredLevel) {
                return true;
            }
        }

        return false;
    }
}
