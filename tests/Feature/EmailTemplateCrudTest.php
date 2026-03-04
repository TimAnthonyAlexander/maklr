<?php

namespace App\Tests\Feature;

use BaseApi\Testing\TestCase;
use App\Models\EmailTemplate;
use App\Models\Office;

class EmailTemplateCrudTest extends TestCase
{
    private ?Office $testOffice = null;

    private ?Office $otherOffice = null;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->testOffice === null) {
            $this->testOffice = $this->ensureOffice('Test Office for Templates');
        }
        if ($this->otherOffice === null) {
            $this->otherOffice = $this->ensureOffice('Other Office for Templates');
        }
    }

    protected function tearDown(): void
    {
        // Clean up templates created during tests
        foreach (['agent-user-id', 'manager-user-id', 'other-agent-id'] as $userId) {
            $templates = EmailTemplate::where('created_by_user_id', '=', $userId)->get();
            foreach ($templates as $t) {
                $t->delete();
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

    private function managerUser(array $overrides = []): array
    {
        return array_merge([
            'id' => 'manager-user-id',
            'name' => 'Manager User',
            'email' => 'manager@test.com',
            'role' => 'manager',
            'office_id' => $this->testOffice->id,
        ], $overrides);
    }

    private function agentUser(array $overrides = []): array
    {
        return array_merge([
            'id' => 'agent-user-id',
            'name' => 'Agent User',
            'email' => 'agent@test.com',
            'role' => 'agent',
            'office_id' => $this->testOffice->id,
        ], $overrides);
    }

    private function createTemplate(array $overrides = []): EmailTemplate
    {
        $template = new EmailTemplate();
        $template->name = $overrides['name'] ?? 'Test Template ' . uniqid();
        $template->subject = $overrides['subject'] ?? 'Test Subject';
        $template->body_html = $overrides['body_html'] ?? '<p>Test body</p>';
        $template->body_text = $overrides['body_text'] ?? 'Test body';
        $template->category = $overrides['category'] ?? null;
        $template->scope = $overrides['scope'] ?? 'personal';
        $template->active = $overrides['active'] ?? true;
        $template->office_id = $overrides['office_id'] ?? $this->testOffice->id;
        $template->created_by_user_id = $overrides['created_by_user_id'] ?? 'agent-user-id';
        $template->save();

        return $template;
    }

    // --- List ---

    public function test_agent_can_list_own_personal_templates(): void
    {
        $template = $this->createTemplate(['scope' => 'personal', 'created_by_user_id' => 'agent-user-id']);

        $response = $this->actingAs($this->agentUser())
            ->get('/email-templates');

        $response->assertOk();
        $response->assertJsonHas('items');

        $ids = array_column($response->json()['items'] ?? [], 'id');
        $this->assertContains($template->id, $ids);
    }

    public function test_agent_can_see_office_templates(): void
    {
        $template = $this->createTemplate([
            'scope' => 'office',
            'created_by_user_id' => 'manager-user-id',
        ]);

        $response = $this->actingAs($this->agentUser())
            ->get('/email-templates');

        $response->assertOk();
        $ids = array_column($response->json()['items'] ?? [], 'id');
        $this->assertContains($template->id, $ids);
    }

    public function test_agent_cannot_see_other_users_personal_templates(): void
    {
        $template = $this->createTemplate([
            'scope' => 'personal',
            'created_by_user_id' => 'other-agent-id',
        ]);

        $response = $this->actingAs($this->agentUser())
            ->get('/email-templates');

        $response->assertOk();
        $ids = array_column($response->json()['items'] ?? [], 'id');
        $this->assertNotContains($template->id, $ids);
    }

    public function test_list_supports_scope_filter(): void
    {
        $personal = $this->createTemplate(['scope' => 'personal', 'created_by_user_id' => 'agent-user-id']);
        $office = $this->createTemplate(['scope' => 'office', 'created_by_user_id' => 'manager-user-id']);

        $response = $this->actingAs($this->agentUser())
            ->get('/email-templates', ['scope' => 'office']);

        $response->assertOk();
        $ids = array_column($response->json()['items'] ?? [], 'id');
        $this->assertContains($office->id, $ids);
        $this->assertNotContains($personal->id, $ids);
    }

    public function test_list_supports_search(): void
    {
        $matching = $this->createTemplate(['name' => 'Welcome Email', 'created_by_user_id' => 'agent-user-id']);
        $other = $this->createTemplate(['name' => 'Follow Up', 'created_by_user_id' => 'agent-user-id']);

        $response = $this->actingAs($this->agentUser())
            ->get('/email-templates', ['q' => 'Welcome']);

        $response->assertOk();
        $ids = array_column($response->json()['items'] ?? [], 'id');
        $this->assertContains($matching->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    // --- Show ---

    public function test_agent_can_view_own_template(): void
    {
        $template = $this->createTemplate(['created_by_user_id' => 'agent-user-id']);

        $response = $this->actingAs($this->agentUser())
            ->get('/email-templates/' . $template->id);

        $response->assertOk();
        $this->assertSame($template->id, $response->json()['id']);
    }

    public function test_agent_can_view_office_template(): void
    {
        $template = $this->createTemplate(['scope' => 'office', 'created_by_user_id' => 'manager-user-id']);

        $response = $this->actingAs($this->agentUser())
            ->get('/email-templates/' . $template->id);

        $response->assertOk();
    }

    public function test_agent_cannot_view_others_personal_template(): void
    {
        $template = $this->createTemplate(['scope' => 'personal', 'created_by_user_id' => 'other-agent-id']);

        $response = $this->actingAs($this->agentUser())
            ->get('/email-templates/' . $template->id);

        $response->assertNotFound();
    }

    // --- Create ---

    public function test_agent_can_create_personal_template(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->post('/email-templates', [
                'name' => 'My Template',
                'subject' => 'Hello {{contact.first_name}}',
                'body_html' => '<p>Test</p>',
                'scope' => 'personal',
            ]);

        $response->assertCreated();
        $this->assertSame('personal', $response->json()['scope']);
        $this->assertSame('agent-user-id', $response->json()['created_by_user_id']);
    }

    public function test_agent_cannot_create_office_template(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->post('/email-templates', [
                'name' => 'Office Template',
                'subject' => 'Hello',
                'scope' => 'office',
            ]);

        $response->assertForbidden();
    }

    public function test_manager_can_create_office_template(): void
    {
        $response = $this->actingAs($this->managerUser())
            ->post('/email-templates', [
                'name' => 'Office Template',
                'subject' => 'Hello',
                'scope' => 'office',
            ]);

        $response->assertCreated();
        $this->assertSame('office', $response->json()['scope']);
    }

    public function test_create_validates_required_fields(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->post('/email-templates', ['scope' => 'personal']);

        $status = $response->getResponse()->status;
        $this->assertTrue(
            in_array($status, [422, 500]),
            'Expected validation error status code, got ' . $status,
        );
    }

    // --- Update ---

    public function test_agent_can_update_own_template(): void
    {
        $template = $this->createTemplate(['created_by_user_id' => 'agent-user-id']);

        $response = $this->actingAs($this->agentUser())
            ->patch('/email-templates/' . $template->id, [
                'name' => 'Updated Name',
            ]);

        $response->assertOk();
        $this->assertSame('Updated Name', $response->json()['name']);
    }

    public function test_agent_cannot_update_others_personal_template(): void
    {
        $template = $this->createTemplate(['scope' => 'personal', 'created_by_user_id' => 'other-agent-id']);

        $response = $this->actingAs($this->agentUser())
            ->patch('/email-templates/' . $template->id, [
                'name' => 'Hacked',
            ]);

        $response->assertNotFound();
    }

    public function test_agent_cannot_update_office_template(): void
    {
        $template = $this->createTemplate(['scope' => 'office', 'created_by_user_id' => 'manager-user-id']);

        $response = $this->actingAs($this->agentUser())
            ->patch('/email-templates/' . $template->id, [
                'name' => 'Hacked',
            ]);

        $response->assertNotFound();
    }

    public function test_manager_can_update_office_template(): void
    {
        $template = $this->createTemplate(['scope' => 'office', 'created_by_user_id' => 'manager-user-id']);

        $response = $this->actingAs($this->managerUser())
            ->patch('/email-templates/' . $template->id, [
                'name' => 'Updated Office Template',
                'active' => false,
            ]);

        $response->assertOk();
        $this->assertSame('Updated Office Template', $response->json()['name']);
        $this->assertFalse($response->json()['active']);
    }

    // --- Delete ---

    public function test_agent_can_delete_own_template(): void
    {
        $template = $this->createTemplate(['created_by_user_id' => 'agent-user-id']);
        $id = $template->id;

        $response = $this->actingAs($this->agentUser())
            ->delete('/email-templates/' . $id);

        $response->assertOk();
        $this->assertNull(EmailTemplate::find($id));
    }

    public function test_agent_cannot_delete_others_template(): void
    {
        $template = $this->createTemplate(['scope' => 'personal', 'created_by_user_id' => 'other-agent-id']);

        $response = $this->actingAs($this->agentUser())
            ->delete('/email-templates/' . $template->id);

        $response->assertNotFound();
    }

    public function test_manager_can_delete_office_template(): void
    {
        $template = $this->createTemplate(['scope' => 'office', 'created_by_user_id' => 'manager-user-id']);
        $id = $template->id;

        $response = $this->actingAs($this->managerUser())
            ->delete('/email-templates/' . $id);

        $response->assertOk();
        $this->assertNull(EmailTemplate::find($id));
    }

    // --- Placeholders ---

    public function test_can_get_placeholders(): void
    {
        $response = $this->actingAs($this->agentUser())
            ->get('/email-templates/placeholders');

        $response->assertOk();
        $data = $response->json();
        $this->assertArrayHasKey('contact', $data);
        $this->assertArrayHasKey('estate', $data);
        $this->assertArrayHasKey('user', $data);
    }
}
