<?php

namespace App\Tests\Unit;

use App\Models\Contact;
use App\Models\Estate;
use App\Models\User;
use App\Services\EmailDraftService;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class EmailDraftServiceTest extends TestCase
{
    private EmailDraftService $service;

    protected function setUp(): void
    {
        // Use reflection to create instance without constructor
        $reflection = new ReflectionClass(EmailDraftService::class);
        $this->service = $reflection->newInstanceWithoutConstructor();
    }

    private function makeContact(array $overrides = []): Contact
    {
        $contact = new Contact();
        $contact->first_name = array_key_exists('first_name', $overrides) ? $overrides['first_name'] : 'Anna';
        $contact->last_name = array_key_exists('last_name', $overrides) ? $overrides['last_name'] : 'Schmidt';
        $contact->email = array_key_exists('email', $overrides) ? $overrides['email'] : 'anna@example.com';
        $contact->phone = array_key_exists('phone', $overrides) ? $overrides['phone'] : '+49123456';
        $contact->type = array_key_exists('type', $overrides) ? $overrides['type'] : 'buyer';
        $contact->stage = array_key_exists('stage', $overrides) ? $overrides['stage'] : 'warm';
        $contact->city = array_key_exists('city', $overrides) ? $overrides['city'] : 'Munich';
        $contact->country = array_key_exists('country', $overrides) ? $overrides['country'] : 'DE';
        $contact->company_name = array_key_exists('company_name', $overrides) ? $overrides['company_name'] : null;
        $contact->salutation = array_key_exists('salutation', $overrides) ? $overrides['salutation'] : 'Mrs.';

        return $contact;
    }

    private function makeEstate(array $overrides = []): Estate
    {
        $estate = new Estate();
        $estate->title = $overrides['title'] ?? '3-Room Apartment Berlin';
        $estate->property_type = $overrides['property_type'] ?? 'apartment';
        $estate->marketing_type = $overrides['marketing_type'] ?? 'sale';
        $estate->status = $overrides['status'] ?? 'active';
        $estate->price = $overrides['price'] ?? 350000.00;
        $estate->rooms = $overrides['rooms'] ?? 3;
        $estate->area_total = $overrides['area_total'] ?? 85.0;
        $estate->city = $overrides['city'] ?? 'Berlin';
        $estate->street = $overrides['street'] ?? 'Hauptstraße';
        $estate->house_number = $overrides['house_number'] ?? '12';

        return $estate;
    }

    private function makeUser(array $overrides = []): User
    {
        $user = new User();
        $user->name = array_key_exists('name', $overrides) ? $overrides['name'] : 'Max Agent';
        $user->email = array_key_exists('email', $overrides) ? $overrides['email'] : 'max@realty.com';
        $user->phone = array_key_exists('phone', $overrides) ? $overrides['phone'] : '+49987654';

        return $user;
    }

    // --- Contact context ---

    public function test_build_contact_context_includes_all_fields(): void
    {
        $contact = $this->makeContact();
        $context = $this->service->buildContactContext($contact);

        $this->assertSame('Anna Schmidt', $context['name']);
        $this->assertSame('buyer', $context['type']);
        $this->assertSame('warm', $context['stage']);
        $this->assertSame('anna@example.com', $context['email']);
        $this->assertSame('+49123456', $context['phone']);
        $this->assertSame('Munich', $context['city']);
        $this->assertSame('DE', $context['country']);
        $this->assertSame('Mrs.', $context['salutation']);
    }

    public function test_build_contact_context_returns_empty_for_null(): void
    {
        $this->assertSame([], $this->service->buildContactContext(null));
    }

    public function test_build_contact_context_omits_null_optional_fields(): void
    {
        $contact = $this->makeContact([
            'phone' => null,
            'city' => null,
            'country' => null,
            'company_name' => null,
            'salutation' => null,
        ]);
        $context = $this->service->buildContactContext($contact);

        $this->assertArrayNotHasKey('phone', $context);
        $this->assertArrayNotHasKey('city', $context);
        $this->assertArrayNotHasKey('country', $context);
        $this->assertArrayNotHasKey('company', $context);
        $this->assertArrayNotHasKey('salutation', $context);
    }

    // --- Estate context ---

    public function test_build_estate_context_includes_all_fields(): void
    {
        $estate = $this->makeEstate();
        $context = $this->service->buildEstateContext($estate);

        $this->assertSame('3-Room Apartment Berlin', $context['title']);
        $this->assertSame('apartment', $context['property_type']);
        $this->assertSame('sale', $context['marketing_type']);
        $this->assertSame('active', $context['status']);
        $this->assertSame('350,000.00', $context['price']);
        $this->assertSame('3', $context['rooms']);
        $this->assertStringContainsString('85', $context['area_total']);
        $this->assertSame('Berlin', $context['city']);
        $this->assertSame('Hauptstraße 12', $context['address']);
    }

    public function test_build_estate_context_returns_empty_for_null(): void
    {
        $this->assertSame([], $this->service->buildEstateContext(null));
    }

    public function test_build_estate_context_omits_null_optional_fields(): void
    {
        $estate = new Estate();
        $estate->title = 'Basic Estate';
        $context = $this->service->buildEstateContext($estate);

        $this->assertArrayNotHasKey('price', $context);
        $this->assertArrayNotHasKey('rooms', $context);
        $this->assertArrayNotHasKey('city', $context);
        $this->assertArrayNotHasKey('address', $context);
    }

    // --- Agent context ---

    public function test_build_agent_context_includes_fields(): void
    {
        $user = $this->makeUser();
        $context = $this->service->buildAgentContext($user);

        $this->assertSame('Max Agent', $context['name']);
        $this->assertSame('max@realty.com', $context['email']);
        $this->assertSame('+49987654', $context['phone']);
    }

    public function test_build_agent_context_returns_empty_for_null(): void
    {
        $this->assertSame([], $this->service->buildAgentContext(null));
    }

    public function test_build_agent_context_omits_null_phone(): void
    {
        $user = $this->makeUser(['phone' => null]);
        $context = $this->service->buildAgentContext($user);

        $this->assertArrayNotHasKey('phone', $context);
    }

    // --- Intent instructions ---

    public function test_intent_instruction_returns_guidance_for_each_intent(): void
    {
        $intents = [
            'follow_up_viewing',
            'price_update',
            'new_listing_match',
            'document_request',
            'viewing_invitation',
            'general_follow_up',
            'custom',
        ];

        foreach ($intents as $intent) {
            $instruction = $this->service->getIntentInstruction($intent);
            $this->assertNotEmpty($instruction, "Intent '{$intent}' should have an instruction");
        }
    }

    public function test_unknown_intent_falls_back_to_custom(): void
    {
        $customInstruction = $this->service->getIntentInstruction('custom');
        $unknownInstruction = $this->service->getIntentInstruction('nonexistent');

        $this->assertSame($customInstruction, $unknownInstruction);
    }

    // --- Activity summary ---

    public function test_build_activity_summary_returns_empty_without_ids(): void
    {
        $result = $this->service->buildActivitySummary(null, null, 'office-1');
        $this->assertSame([], $result);
    }
}
