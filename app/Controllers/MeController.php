<?php

namespace App\Controllers;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Attributes\ResponseType;
use BaseApi\Http\Attributes\Tag;

#[Tag('Authentication')]
class MeController extends Controller
{
    #[ResponseType(['user' => 'array'])]
    public function get(): JsonResponse
    {
        $user = $this->request->user ?? null;

        if (!$user) {
            return JsonResponse::error('Not authenticated', 401);
        }

        return JsonResponse::ok(['user' => $user]);
    }
}
