<?php

namespace App\Tests\Feature;

use BaseApi\Testing\TestCase;
use App\Models\Document;
use App\Models\Estate;
use App\Models\Office;

class DocumentCrudTest extends TestCase
{
    private ?Office $testOffice = null;

    private ?Office $otherOffice = null;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->testOffice === null) {
            $this->testOffice = $this->ensureOffice('Test Office for Documents');
        }
        if ($this->otherOffice === null) {
            $this->otherOffice = $this->ensureOffice('Other Office for Documents');
        }
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

    private function createDocument(array $overrides = []): Document
    {
        $document = new Document();
        $document->file_path = $overrides['file_path'] ?? 'documents/test/test-' . uniqid() . '.pdf';
        $document->file_name = $overrides['file_name'] ?? 'test-document.pdf';
        $document->mime_type = $overrides['mime_type'] ?? 'application/pdf';
        $document->file_size = $overrides['file_size'] ?? 1024;
        $document->category = $overrides['category'] ?? 'contract';
        $document->office_id = $overrides['office_id'] ?? $this->testOffice->id;
        $document->uploaded_by_user_id = $overrides['uploaded_by_user_id'] ?? 'agent-user-id';
        $document->estate_id = $overrides['estate_id'] ?? null;
        $document->contact_id = $overrides['contact_id'] ?? null;
        $document->save();

        return $document;
    }

    private function createEstate(array $overrides = []): Estate
    {
        $estate = new Estate();
        $estate->title = $overrides['title'] ?? 'Test Estate ' . uniqid();
        $estate->property_type = 'apartment';
        $estate->marketing_type = 'sale';
        $estate->status = 'active';
        $estate->office_id = $overrides['office_id'] ?? $this->testOffice->id;
        $estate->save();

        return $estate;
    }

    // --- List ---

    public function test_agent_can_list_documents(): void
    {
        $doc = $this->createDocument();

        $response = $this->actingAs($this->agentUser())
            ->get('/documents');

        $response->assertOk();
        $response->assertJsonHas('items');

        $doc->delete();
    }

    public function test_list_documents_supports_pagination(): void
    {
        $doc = $this->createDocument();

        $response = $this->actingAs($this->agentUser())
            ->get('/documents', ['page' => 1, 'per_page' => 5]);

        $response->assertOk();
        $response->assertJsonHas('pagination');

        $doc->delete();
    }

    public function test_list_documents_filters_by_category(): void
    {
        $contract = $this->createDocument(['category' => 'contract', 'file_name' => 'contract.pdf']);
        $photo = $this->createDocument(['category' => 'photo', 'file_name' => 'photo.jpg']);

        $response = $this->actingAs($this->agentUser())
            ->get('/documents', ['category' => 'contract']);

        $response->assertOk();
        $data = $response->json()['items'] ?? [];
        $ids = array_column($data, 'id');
        $this->assertContains($contract->id, $ids);
        $this->assertNotContains($photo->id, $ids);

        $contract->delete();
        $photo->delete();
    }

    public function test_list_documents_filters_by_estate_id(): void
    {
        $estate = $this->createEstate();
        $linked = $this->createDocument(['estate_id' => $estate->id]);
        $unlinked = $this->createDocument();

        $response = $this->actingAs($this->agentUser())
            ->get('/documents', ['estate_id' => $estate->id]);

        $response->assertOk();
        $data = $response->json()['items'] ?? [];
        $ids = array_column($data, 'id');
        $this->assertContains($linked->id, $ids);
        $this->assertNotContains($unlinked->id, $ids);

        $linked->delete();
        $unlinked->delete();
        $estate->delete();
    }

    public function test_list_documents_search_by_file_name(): void
    {
        $unique = 'UniqueDocName' . uniqid();
        $doc = $this->createDocument(['file_name' => $unique . '.pdf']);

        $response = $this->actingAs($this->agentUser())
            ->get('/documents', ['q' => $unique]);

        $response->assertOk();
        $data = $response->json()['items'] ?? [];
        $this->assertNotEmpty($data);
        $this->assertStringContainsString($unique, $data[0]['file_name']);

        $doc->delete();
    }

    public function test_list_documents_scoped_to_office(): void
    {
        $ownDoc = $this->createDocument(['office_id' => $this->testOffice->id]);
        $otherDoc = $this->createDocument(['office_id' => $this->otherOffice->id]);

        $response = $this->actingAs($this->agentUser())
            ->get('/documents');

        $response->assertOk();
        $data = $response->json()['items'] ?? [];
        $ids = array_column($data, 'id');
        $this->assertContains($ownDoc->id, $ids);
        $this->assertNotContains($otherDoc->id, $ids);

        $ownDoc->delete();
        $otherDoc->delete();
    }

    // --- Show ---

    public function test_agent_can_show_document(): void
    {
        $doc = $this->createDocument();

        $response = $this->actingAs($this->agentUser())
            ->get('/documents/' . $doc->id);

        $response->assertOk();
        $response->assertJsonPath('id', $doc->id);
        $response->assertJsonPath('file_name', $doc->file_name);

        $doc->delete();
    }

    public function test_show_nonexistent_document_returns_404(): void
    {
        $this->actingAs($this->agentUser())
            ->get('/documents/nonexistent-id')
            ->assertNotFound();
    }

    public function test_show_document_from_other_office_returns_404(): void
    {
        $doc = $this->createDocument(['office_id' => $this->otherOffice->id]);

        $this->actingAs($this->agentUser())
            ->get('/documents/' . $doc->id)
            ->assertNotFound();

        $doc->delete();
    }

    // --- Update ---

    public function test_agent_can_update_document_category(): void
    {
        $doc = $this->createDocument(['category' => 'contract']);

        $response = $this->actingAs($this->agentUser())
            ->patch('/documents/' . $doc->id, ['category' => 'invoice']);

        $response->assertOk();
        $response->assertJsonPath('category', 'invoice');

        $doc->delete();
    }

    public function test_update_document_validates_category(): void
    {
        $doc = $this->createDocument();

        $this->actingAs($this->agentUser())
            ->patch('/documents/' . $doc->id, ['category' => 'invalid_category'])
            ->assertStatus(422);

        $doc->delete();
    }

    public function test_update_document_can_link_estate(): void
    {
        $estate = $this->createEstate();
        $doc = $this->createDocument();

        $response = $this->actingAs($this->agentUser())
            ->patch('/documents/' . $doc->id, ['estate_id' => $estate->id]);

        $response->assertOk();
        $response->assertJsonPath('estate_id', $estate->id);

        $doc->delete();
        $estate->delete();
    }

    public function test_update_document_rejects_estate_from_other_office(): void
    {
        $otherEstate = $this->createEstate(['office_id' => $this->otherOffice->id]);
        $doc = $this->createDocument();

        $this->actingAs($this->agentUser())
            ->patch('/documents/' . $doc->id, ['estate_id' => $otherEstate->id])
            ->assertStatus(400);

        $doc->delete();
        $otherEstate->delete();
    }

    public function test_update_nonexistent_document_returns_404(): void
    {
        $this->actingAs($this->agentUser())
            ->patch('/documents/nonexistent-id', ['category' => 'contract'])
            ->assertNotFound();
    }

    // --- Delete ---

    public function test_manager_can_delete_document(): void
    {
        $doc = $this->createDocument();
        $docId = $doc->id;

        $response = $this->actingAs($this->managerUser())
            ->delete('/documents/' . $docId);

        $response->assertOk();

        $deleted = Document::find($docId);
        $this->assertNull($deleted);
    }

    public function test_delete_nonexistent_document_returns_404(): void
    {
        $this->actingAs($this->managerUser())
            ->delete('/documents/nonexistent-id')
            ->assertNotFound();
    }

    public function test_delete_document_from_other_office_returns_404(): void
    {
        $doc = $this->createDocument(['office_id' => $this->otherOffice->id]);

        $this->actingAs($this->managerUser())
            ->delete('/documents/' . $doc->id)
            ->assertNotFound();

        $doc->delete();
    }

}
