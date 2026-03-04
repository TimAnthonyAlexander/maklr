<?php

namespace App\Tests\Unit;

use App\Models\Contact;
use App\Models\EmailTemplate;
use App\Models\Estate;
use App\Models\User;
use App\Services\EmailTemplateService;
use PHPUnit\Framework\TestCase;

class EmailTemplateServiceTest extends TestCase
{
    private EmailTemplateService $service;

    protected function setUp(): void
    {
        $this->service = new EmailTemplateService();
    }

    private function makeTemplate(array $overrides = []): EmailTemplate
    {
        $template = new EmailTemplate();
        $template->name = $overrides['name'] ?? 'Test Template';
        $template->subject = $overrides['subject'] ?? 'Hello {{contact.first_name}}';
        $template->body_html = array_key_exists('body_html', $overrides)
            ? $overrides['body_html']
            : '<p>Dear {{contact.first_name}} {{contact.last_name}},</p><p>Regarding {{estate.title}}.</p>';
        $template->body_text = array_key_exists('body_text', $overrides)
            ? $overrides['body_text']
            : 'Dear {{contact.first_name}} {{contact.last_name}}, Regarding {{estate.title}}.';

        return $template;
    }

    private function makeContact(array $overrides = []): Contact
    {
        $contact = new Contact();
        $contact->first_name = $overrides['first_name'] ?? 'John';
        $contact->last_name = $overrides['last_name'] ?? 'Doe';
        $contact->email = $overrides['email'] ?? 'john@example.com';
        $contact->phone = $overrides['phone'] ?? '+49123456';
        $contact->mobile = $overrides['mobile'] ?? '+49789012';
        $contact->company_name = $overrides['company_name'] ?? 'Acme Corp';
        $contact->city = $overrides['city'] ?? 'Berlin';
        $contact->street = $overrides['street'] ?? 'Hauptstraße 1';
        $contact->zip = $overrides['zip'] ?? '10115';

        return $contact;
    }

    private function makeEstate(array $overrides = []): Estate
    {
        $estate = new Estate();
        $estate->title = $overrides['title'] ?? 'Luxury Apartment';
        $estate->price = $overrides['price'] ?? 350000;
        $estate->city = $overrides['city'] ?? 'Munich';
        $estate->street = $overrides['street'] ?? 'Marienplatz 5';
        $estate->rooms = $overrides['rooms'] ?? 4;
        $estate->area_total = $overrides['area_total'] ?? 120.5;
        $estate->area_living = $overrides['area_living'] ?? 95.0;
        $estate->property_type = $overrides['property_type'] ?? 'apartment';
        $estate->marketing_type = $overrides['marketing_type'] ?? 'sale';

        return $estate;
    }

    private function makeUser(array $overrides = []): User
    {
        $user = new User();
        $user->name = $overrides['name'] ?? 'Agent Smith';
        $user->email = $overrides['email'] ?? 'agent@maklr.com';
        $user->phone = $overrides['phone'] ?? '+49555000';

        return $user;
    }

    public function test_resolves_all_contact_placeholders(): void
    {
        $template = $this->makeTemplate([
            'subject' => '{{contact.first_name}} {{contact.last_name}}',
            'body_html' => '<p>{{contact.email}} {{contact.phone}} {{contact.mobile}} {{contact.company_name}} {{contact.city}} {{contact.street}} {{contact.zip}}</p>',
            'body_text' => null,
        ]);

        $result = $this->service->resolve(
            $template,
            $this->makeContact(),
            null,
            $this->makeUser(),
        );

        $this->assertSame('John Doe', $result['subject']);
        $this->assertStringContainsString('john@example.com', $result['body_html']);
        $this->assertStringContainsString('+49123456', $result['body_html']);
        $this->assertStringContainsString('+49789012', $result['body_html']);
        $this->assertStringContainsString('Acme Corp', $result['body_html']);
        $this->assertStringContainsString('Berlin', $result['body_html']);
        $this->assertStringContainsString('Hauptstraße 1', $result['body_html']);
        $this->assertStringContainsString('10115', $result['body_html']);
        $this->assertNull($result['body_text']);
    }

    public function test_resolves_all_estate_placeholders(): void
    {
        $template = $this->makeTemplate([
            'subject' => '{{estate.title}} - {{estate.price}}',
            'body_html' => '<p>{{estate.city}} {{estate.street}} {{estate.rooms}} {{estate.area_total}} {{estate.area_living}} {{estate.property_type}} {{estate.marketing_type}}</p>',
            'body_text' => null,
        ]);

        $result = $this->service->resolve(
            $template,
            null,
            $this->makeEstate(),
            $this->makeUser(),
        );

        $this->assertSame('Luxury Apartment - 350000', $result['subject']);
        $this->assertStringContainsString('Munich', $result['body_html']);
        $this->assertStringContainsString('Marienplatz 5', $result['body_html']);
        $this->assertStringContainsString('4', $result['body_html']);
        $this->assertStringContainsString('120.5', $result['body_html']);
        $this->assertStringContainsString('95', $result['body_html']);
        $this->assertStringContainsString('apartment', $result['body_html']);
        $this->assertStringContainsString('sale', $result['body_html']);
    }

    public function test_resolves_user_placeholders(): void
    {
        $template = $this->makeTemplate([
            'subject' => 'From {{user.name}}',
            'body_html' => '<p>{{user.email}} {{user.phone}}</p>',
            'body_text' => '{{user.name}} {{user.email}}',
        ]);

        $result = $this->service->resolve(
            $template,
            null,
            null,
            $this->makeUser(),
        );

        $this->assertSame('From Agent Smith', $result['subject']);
        $this->assertStringContainsString('agent@maklr.com', $result['body_html']);
        $this->assertStringContainsString('+49555000', $result['body_html']);
        $this->assertStringContainsString('Agent Smith', $result['body_text']);
    }

    public function test_null_contact_replaces_with_empty_string(): void
    {
        $template = $this->makeTemplate([
            'subject' => 'Hi {{contact.first_name}}!',
            'body_html' => null,
            'body_text' => null,
        ]);

        $result = $this->service->resolve(
            $template,
            null,
            null,
            $this->makeUser(),
        );

        $this->assertSame('Hi !', $result['subject']);
    }

    public function test_null_estate_replaces_with_empty_string(): void
    {
        $template = $this->makeTemplate([
            'subject' => 'About {{estate.title}}',
            'body_html' => null,
            'body_text' => null,
        ]);

        $result = $this->service->resolve(
            $template,
            null,
            null,
            $this->makeUser(),
        );

        $this->assertSame('About ', $result['subject']);
    }

    public function test_nullable_contact_fields_replaced_with_empty(): void
    {
        $contact = new Contact();
        $contact->first_name = 'Jane';
        // All other fields are null

        $template = $this->makeTemplate([
            'subject' => '{{contact.first_name}} {{contact.last_name}} {{contact.phone}}',
            'body_html' => null,
            'body_text' => null,
        ]);

        $result = $this->service->resolve(
            $template,
            $contact,
            null,
            $this->makeUser(),
        );

        $this->assertSame('Jane  ', $result['subject']);
    }

    public function test_mixed_placeholders_all_entities(): void
    {
        $template = $this->makeTemplate([
            'subject' => '{{contact.first_name}}: {{estate.title}}',
            'body_html' => '<p>Hi {{contact.first_name}}, re: {{estate.title}} in {{estate.city}}. Best, {{user.name}}</p>',
            'body_text' => 'Hi {{contact.first_name}}, re: {{estate.title}} in {{estate.city}}. Best, {{user.name}}',
        ]);

        $result = $this->service->resolve(
            $template,
            $this->makeContact(),
            $this->makeEstate(),
            $this->makeUser(),
        );

        $this->assertSame('John: Luxury Apartment', $result['subject']);
        $this->assertStringContainsString('Hi John, re: Luxury Apartment in Munich. Best, Agent Smith', $result['body_html']);
        $this->assertStringContainsString('Hi John, re: Luxury Apartment in Munich. Best, Agent Smith', $result['body_text']);
    }

    public function test_available_placeholders_returns_grouped_list(): void
    {
        $placeholders = $this->service->availablePlaceholders();

        $this->assertArrayHasKey('contact', $placeholders);
        $this->assertArrayHasKey('estate', $placeholders);
        $this->assertArrayHasKey('user', $placeholders);

        $this->assertCount(9, $placeholders['contact']);
        $this->assertCount(9, $placeholders['estate']);
        $this->assertCount(3, $placeholders['user']);

        // Check structure
        $first = $placeholders['contact'][0];
        $this->assertArrayHasKey('key', $first);
        $this->assertArrayHasKey('label', $first);
        $this->assertStringStartsWith('{{contact.', $first['key']);
    }

    public function test_no_recursive_replacement(): void
    {
        $template = $this->makeTemplate([
            'subject' => '{{contact.first_name}}',
            'body_html' => null,
            'body_text' => null,
        ]);

        // Contact first_name contains another placeholder syntax
        $contact = $this->makeContact(['first_name' => '{{estate.title}}']);

        $result = $this->service->resolve(
            $template,
            $contact,
            $this->makeEstate(),
            $this->makeUser(),
        );

        // Should not resolve nested placeholder - str_replace does single pass
        $this->assertSame('{{estate.title}}', $result['subject']);
    }
}
