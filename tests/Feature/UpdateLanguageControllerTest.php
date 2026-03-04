<?php

namespace App\Tests\Feature;

use App\Models\User;
use BaseApi\Testing\TestCase;

class UpdateLanguageControllerTest extends TestCase
{
    private ?User $testUser = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->testUser = $this->createTestUser();
    }

    protected function tearDown(): void
    {
        $this->testUser?->delete();
        parent::tearDown();
    }

    private function createTestUser(): User
    {
        $user = new User();
        $user->name = 'Lang Test User';
        $user->email = uniqid() . '@langtest.com';
        $user->password = password_hash('password123', PASSWORD_DEFAULT);
        $user->role = 'agent';
        $user->language = 'en';
        $user->save();

        return $user;
    }

    public function test_update_language_requires_auth(): void
    {
        $response = $this->post('/me/language', ['language' => 'de']);

        $response->assertStatus(401);
    }

    public function test_update_language_validates_input(): void
    {
        $response = $this->actingAs([
            'id' => $this->testUser->id,
            'role' => 'agent',
        ])->post('/me/language', ['language' => '']);

        $response->assertBadRequest();
    }

    public function test_update_language_saves_preference(): void
    {
        $response = $this->actingAs([
            'id' => $this->testUser->id,
            'role' => 'agent',
        ])->post('/me/language', ['language' => 'de']);

        $response->assertOk();

        $body = $response->json();
        $this->assertTrue($body['data']['success'] ?? $body['success'] ?? false);

        // Verify the language was persisted
        $refreshed = User::find($this->testUser->id);
        $this->assertInstanceOf(User::class, $refreshed);
        $this->assertSame('de', $refreshed->language);
    }
}
