import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useGetCustomFieldDefinitionList } from "../../api/hooks";
import type { CustomFieldDefinition } from "../../api/types";

interface CustomFieldsSectionProps {
  entityType: "estate" | "contact";
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  disabled?: boolean;
}

function renderField(
  def: CustomFieldDefinition,
  value: unknown,
  onChange: (name: string, value: unknown) => void,
  disabled: boolean,
) {
  const name = def.name ?? "";
  const label = def.label ?? name;

  switch (def.field_type) {
    case "text":
      return (
        <TextField
          key={name}
          label={label}
          size="small"
          fullWidth
          required={def.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={disabled}
        />
      );

    case "textarea":
      return (
        <TextField
          key={name}
          label={label}
          size="small"
          fullWidth
          multiline
          rows={3}
          required={def.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={disabled}
        />
      );

    case "number":
      return (
        <TextField
          key={name}
          label={label}
          size="small"
          fullWidth
          type="number"
          required={def.required}
          value={value != null ? String(value) : ""}
          onChange={(e) =>
            onChange(name, e.target.value === "" ? null : Number(e.target.value))
          }
          disabled={disabled}
        />
      );

    case "date":
      return (
        <TextField
          key={name}
          label={label}
          size="small"
          fullWidth
          type="date"
          required={def.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(name, e.target.value || null)}
          disabled={disabled}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      );

    case "boolean":
      return (
        <FormControlLabel
          key={name}
          control={
            <Switch
              checked={Boolean(value)}
              onChange={(e) => onChange(name, e.target.checked)}
              size="small"
              disabled={disabled}
            />
          }
          label={label}
        />
      );

    case "select": {
      const options = def.options ?? [];
      return (
        <FormControl key={name} size="small" fullWidth>
          <InputLabel>{label}</InputLabel>
          <Select
            label={label}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(name, e.target.value || null)}
            disabled={disabled}
            required={def.required}
          >
            <MenuItem value="">
              <em>&mdash;</em>
            </MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    default:
      return null;
  }
}

export function CustomFieldsSection({
  entityType,
  values,
  onChange,
  disabled = false,
}: CustomFieldsSectionProps) {
  const { data } = useGetCustomFieldDefinitionList({
    entity_type: entityType,
    active: "1",
    per_page: 100,
  });

  const definitions = data?.items ?? [];

  if (definitions.length === 0) {
    return null;
  }

  const sorted = [...definitions].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const handleFieldChange = (name: string, value: unknown) => {
    onChange({ ...values, [name]: value });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {sorted.map((def) =>
        renderField(def, values[def.name ?? ""], handleFieldChange, disabled),
      )}
    </Box>
  );
}
