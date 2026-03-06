<?php

namespace App\Tests\Feature;

use BaseApi\Testing\TestCase;
use App\Models\Contact;
use App\Models\Estate;
use App\Models\Office;

class EmailDraftGenerateTest extends TestCase
{
    private ?Office $testOffice = null;

    private ?Office $otherOffice = null;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->testOffice === null) {
            $this->testOffice = $this->ensureOffice('Test Office for Draft');
        }
        if ($this->otherOffice === null) {
            $this->otherOffice = $this->ensureOffice('Other Office for Draft');
        }
    }

    protected function tearDown(): void
    {
        foreach ([$this->testOffice, $this->otherOffice] as $office) {
            if ($office === null) {
                continue;
            }
            $contacts = Contact::where('office_id', '=', $office->id)->get();
            foreach ($contacts as $c) {
                $c->delete();
            }
            $estates = Estate::where('office_id', '=', $office->id)->get();
            foreach ($estates as $e) {
                $e->delete();
            }
        }

        parent::tearDown();
    }

    private function ensureOffice(string $name): Office
    {
        $existing = Office::firstWhere('name', '=', $name);
        if ($existing instanceof Office) {
            return $existing;
        }

        $office = new Office();
        $office->name = $name;
        $office->save();

        return $office;
    }

    private function agentUser(array $overrides = []): array
    {
        return array_merge([
            'id' => 'draft-agent-id',
            'name' => 'Draft Agent',
            'email' => 'draft-agent@test.com',
            'role' => 'agent',
            'office_id' => $this->testOffice->id,
        ], $overrides);
    }

    private function createContact(array $overrides = []): Contact
    {
        $contact = new Contact();
        $contact->first_name = $overrides['first_name'] ?? 'Test';
        $contact->last_name = $overrides['last_name'] ?? 'Contact';
        $contact->email = $overrides['email'] ?? 'test@example.com';
        $contact->office_id = $overrides['office_id'] ?? $this->testOffice->id;
        $contact->save();

        return $contact;
    }

    private function createEstate(array $overrides = []): Estate
    {
        $estate = new Estate();
        $estate->title = $overrides['title'] ?? 'Test Estate';
        $estate->office_id = $overrides['office_id'] ?? $this->testOffice->id;
        $estate->save();

        return $estate;
    }

    public function test_returns_401_without_auth(): void
    {
        $response = $this->post('/emails/generate-draft', [
            'intent' => 'general_follow_up',
            'contact_id' => 'some-id',
        ]);

        $response->assertStatus(401);
    }

    public function test_returns_error_without_contact_or_estate(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->post('/emails/generate-draft', [
                'intent' => 'general_follow_up',
            ]);

        $response->assertStatus(400);
    }

    public function test_rejects_invalid_intent(): void
    {
        $contact = $this->createContact();

        $response = $this->actingAs($this->agentUser())
            ->post('/emails/generate-draft', [
                'intent' => 'invalid_intent',
                'contact_id' => $contact->id,
            ]);

        // Framework wraps validation errors — verify it's not a success
        $statusCode = $response->getResponse()->status;
        $this->assertGreaterThanOrEqual(400, $statusCode, 'Invalid intent should be rejected');
    }

    public function test_accepts_valid_intents(): void
    {
        $validIntents = [
            'follow_up_viewing',
            'price_update',
            'new_listing_match',
            'document_request',
            'viewing_invitation',
            'general_follow_up',
            'custom',
        ];

        $contact = $this->createContact();

        foreach ($validIntents as $intent) {
            $response = $this->actingAs($this->agentUser())
                ->post('/emails/generate-draft', [
                    'intent' => $intent,
                    'contact_id' => $contact->id,
                ]);

            $statusCode = $response->getResponse()->status;
            // Should not get 400 for valid intents (may get 502 due to no real OpenAI key)
            $this->assertNotEquals(400, $statusCode, "Intent '{$intent}' should be valid but got 400");
        }
    }

    public function test_accepts_estate_id_without_contact(): void
    {
        $estate = $this->createEstate();

        $response = $this->actingAs($this->agentUser())
            ->post('/emails/generate-draft', [
                'intent' => 'viewing_invitation',
                'estate_id' => $estate->id,
            ]);

        $statusCode = $response->getResponse()->status;
        // Should not get 400 — should reach AI call (502 without key is expected)
        $this->assertNotEquals(400, $statusCode);
    }
}
