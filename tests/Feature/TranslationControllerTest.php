<?php

namespace App\Tests\Feature;

use BaseApi\Testing\TestCase;

class TranslationControllerTest extends TestCase
{
    public function test_get_translations_returns_english_by_default(): void
    {
        $response = $this->get('/translations');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'translations',
            ]);
    }

    public function test_get_translations_with_lang_parameter(): void
    {
        $response = $this->get('/translations', ['lang' => 'en']);

        $response->assertStatus(200);

        $body = $response->json();
        $this->assertArrayHasKey('translations', $body);
        $this->assertArrayHasKey('common.welcome', $body['translations']);
        $this->assertSame('Welcome to our application!', $body['translations']['common.welcome']);
    }

    public function test_get_translations_falls_back_to_english_for_unsupported_lang(): void
    {
        $response = $this->get('/translations', ['lang' => 'xx']);

        $response->assertStatus(200);

        $body = $response->json();
        $this->assertArrayHasKey('translations', $body);
        $this->assertArrayHasKey('common.welcome', $body['translations']);
    }
}
