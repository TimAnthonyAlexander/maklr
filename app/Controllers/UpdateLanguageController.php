<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Attributes\ResponseType;
use BaseApi\Http\Attributes\Tag;
use BaseApi\Http\Validation\ValidationException;

#[Tag('User')]
final class UpdateLanguageController extends Controller
{
    public string $language = '';

    #[ResponseType(['success' => 'bool'])]
    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'language' => 'required|string|min:2|max:5',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::badRequest('Validation failed.', $validationException->errors());
        }

        $userData = $this->request->user ?? null;
        if (!$userData || empty($userData['id'])) {
            return JsonResponse::error('Unauthorized', 401);
        }

        $user = User::find($userData['id']);
        if (!$user instanceof User) {
            return JsonResponse::notFound('User not found');
        }

        $user->language = $this->language;
        $user->save();

        return JsonResponse::ok(['success' => true]);
    }
}
