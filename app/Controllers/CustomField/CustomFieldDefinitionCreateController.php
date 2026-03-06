<?php

namespace App\Controllers\CustomField;

use App\Models\CustomFieldDefinition;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class CustomFieldDefinitionCreateController extends Controller
{
    public string $name = '';

    public string $label = '';

    public string $field_type = 'text';

    public string $entity_type = 'estate';

    public ?array $options = null;

    public bool $required = false;

    public int $sort_order = 0;

    private const array FIELD_TYPES = ['text', 'number', 'select', 'boolean', 'date', 'textarea'];

    private const array ENTITY_TYPES = ['estate', 'contact', 'both'];

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'name' => 'required|string|max:100',
                'label' => 'required|string|max:255',
                'field_type' => 'required|string|in:' . implode(',', self::FIELD_TYPES),
                'entity_type' => 'required|string|in:' . implode(',', self::ENTITY_TYPES),
            ]);
        } catch (ValidationException $e) {
            return JsonResponse::validationError($e->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;

        // Check uniqueness within office
        $existing = CustomFieldDefinition::where('office_id', '=', $officeId)
            ->where('name', '=', $this->name)
            ->exists();

        if ($existing) {
            return JsonResponse::validationError(['name' => ['A custom field with this name already exists']]);
        }

        $definition = new CustomFieldDefinition();
        $definition->name = $this->name;
        $definition->label = $this->label;
        $definition->field_type = $this->field_type;
        $definition->entity_type = $this->entity_type;
        $definition->required = $this->required;
        $definition->sort_order = $this->sort_order;
        $definition->office_id = $officeId;

        if ($this->options !== null) {
            $definition->setOptions($this->options);
        }

        $definition->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'custom_field_definition',
            $definition->id,
            ['name' => ['old' => null, 'new' => $definition->name]],
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::created($definition->toArray());
    }
}
