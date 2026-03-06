<?php

namespace App\Controllers\CustomField;

use App\Models\CustomFieldDefinition;
use App\Services\AuditLogService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class CustomFieldDefinitionUpdateController extends Controller
{
    public string $id = '';

    public ?string $label = null;

    public ?string $field_type = null;

    public ?string $entity_type = null;

    public ?array $options = null;

    public ?bool $required = null;

    public ?int $sort_order = null;

    public ?bool $active = null;

    private const array FIELD_TYPES = ['text', 'number', 'select', 'boolean', 'date', 'textarea'];

    private const array ENTITY_TYPES = ['estate', 'contact', 'both'];

    private const array PATCHABLE_FIELDS = [
        'label', 'field_type', 'entity_type', 'required', 'sort_order', 'active',
    ];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $definition = CustomFieldDefinition::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$definition instanceof CustomFieldDefinition) {
            return JsonResponse::notFound('Custom field definition not found');
        }

        try {
            if ($this->field_type !== null) {
                $this->validate(['field_type' => 'string|in:' . implode(',', self::FIELD_TYPES)]);
            }

            if ($this->entity_type !== null) {
                $this->validate(['entity_type' => 'string|in:' . implode(',', self::ENTITY_TYPES)]);
            }
        } catch (ValidationException $e) {
            return JsonResponse::validationError($e->errors());
        }

        // Snapshot old values for audit
        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $definition->{$field};
        }

        // Apply non-null incoming values
        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $definition->{$field} = $this->{$field};
            }
        }

        // Handle options separately
        $oldOptions = $definition->getOptions();
        if ($this->options !== null) {
            $definition->setOptions($this->options);
        }

        $definition->save();

        // Compute diff for audit
        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $definition->{$field};
        }

        if ($this->options !== null) {
            $newOptions = $definition->getOptions();
            if ($oldOptions !== $newOptions) {
                $oldData['options'] = $oldOptions;
                $newData['options'] = $newOptions;
            }
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, array_merge(self::PATCHABLE_FIELDS, ['options']));

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'custom_field_definition',
            $definition->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        return JsonResponse::ok($definition->toArray());
    }
}
