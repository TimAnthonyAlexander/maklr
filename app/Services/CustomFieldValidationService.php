<?php

namespace App\Services;

use App\Models\CustomFieldDefinition;

class CustomFieldValidationService
{
    /**
     * Validate custom field values against active definitions.
     *
     * @param array<string, mixed> $values
     * @return array<string, string[]> Validation errors keyed by field name
     */
    public function validate(array $values, string $entityType, string $officeId): array
    {
        $definitions = CustomFieldDefinition::where('office_id', '=', $officeId)
            ->where('active', '=', true)
            ->get();

        // Filter to definitions matching this entity type
        $applicableDefinitions = [];
        foreach ($definitions as $def) {
            if ($def->entity_type === $entityType || $def->entity_type === 'both') {
                $applicableDefinitions[$def->name] = $def;
            }
        }

        $errors = [];

        // Check required fields
        foreach ($applicableDefinitions as $name => $def) {
            $fieldValue = $values[$name] ?? null;
            if ($def->required && ($fieldValue === null || $fieldValue === '')) {
                $errors['custom_fields.' . $name] = [$def->label . ' is required'];
            }
        }

        // Validate provided values
        foreach ($values as $name => $value) {
            if (!isset($applicableDefinitions[$name])) {
                continue;
            }

            $def = $applicableDefinitions[$name];
            if ($value === null) {
                continue;
            }
            if ($value === '') {
                continue;
            }

            $fieldErrors = $this->validateFieldValue($value, $def);
            if ($fieldErrors !== []) {
                $errors['custom_fields.' . $name] = $fieldErrors;
            }
        }

        return $errors;
    }

    /**
     * @return string[]
     */
    private function validateFieldValue(mixed $value, CustomFieldDefinition $customFieldDefinition): array
    {
        $errors = [];

        switch ($customFieldDefinition->field_type) {
            case 'number':
                if (!is_numeric($value)) {
                    $errors[] = $customFieldDefinition->label . ' must be a number';
                }

                break;

            case 'boolean':
                if (!is_bool($value) && $value !== 0 && $value !== 1 && $value !== '0' && $value !== '1') {
                    $errors[] = $customFieldDefinition->label . ' must be a boolean';
                }

                break;

            case 'select':
                $options = $customFieldDefinition->getOptions();
                if ($options !== [] && !in_array($value, $options, true)) {
                    $errors[] = $customFieldDefinition->label . ' must be one of: ' . implode(', ', $options);
                }

                break;

            case 'date':
                if (!is_string($value) || strtotime($value) === false) {
                    $errors[] = $customFieldDefinition->label . ' must be a valid date';
                }

                break;
        }

        return $errors;
    }
}
