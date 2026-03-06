<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\CacheHelper;
use App\Services\TranslationService;
use BaseApi\App;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Http\Attributes\ResponseType;
use BaseApi\Http\Attributes\Tag;

#[Tag('i18n')]
final class TranslationController extends Controller
{
    public string $lang = '';

    #[ResponseType(['translations' => 'array'])]
    public function get(): Response
    {
        $language = $this->lang === '' ? 'en' : $this->lang;

        // Guard against path traversal — only allow simple language codes
        if (!preg_match('/^[a-z]{2,5}$/i', $language)) {
            $language = 'en';
        }

        $translationService = App::container()->make(TranslationService::class);

        if (!$translationService->isSupported($language)) {
            $language = 'en';
        }

        $user = $this->request->user ?? null;
        $includeAdmin = $user !== null && isset($user['role']) && $user['role'] === 'admin';

        $loadTranslations = function () use ($translationService, $language, $includeAdmin): array {
            $all = $translationService->getAll($language, $includeAdmin);
            return array_filter($all, fn(string $key): bool => !str_starts_with($key, '__'), ARRAY_FILTER_USE_KEY);
        };

        if (App::config('app.env') === 'local') {
            $translations = $loadTranslations();
        } else {
            $cacheKey = $includeAdmin ? $language . ':admin' : $language;
            $translations = CacheHelper::remember('translations', $cacheKey, 86400, $loadTranslations, useJitter: false);
        }

        return JsonResponse::ok([
            'translations' => $translations,
        ]);
    }
}
