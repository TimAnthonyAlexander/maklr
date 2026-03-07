import { Box, TextField, MenuItem } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";
import type { ProcessTriggerType, ProcessEntityType } from "../../api/types";

interface ProcessTriggerConfigFormProps {
  entityType: ProcessEntityType;
  triggerType: ProcessTriggerType;
  triggerConfig: Record<string, unknown>;
  onEntityTypeChange: (value: ProcessEntityType) => void;
  onTriggerTypeChange: (value: ProcessTriggerType) => void;
  onTriggerConfigChange: (config: Record<string, unknown>) => void;
}

export function ProcessTriggerConfigForm({
  entityType,
  triggerType,
  triggerConfig,
  onEntityTypeChange,
  onTriggerTypeChange,
  onTriggerConfigChange,
}: ProcessTriggerConfigFormProps) {
  const { t } = useTranslation();

  const updateConfig = (field: string, value: unknown) => {
    onTriggerConfigChange({ ...triggerConfig, [field]: value });
  };

  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <TextField
        select
        label={t("processes.template_entity_type")}
        value={entityType}
        onChange={(e) => onEntityTypeChange(e.target.value as ProcessEntityType)}
        size="small"
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="estate">{t("processes.entity.estate")}</MenuItem>
        <MenuItem value="contact">{t("processes.entity.contact")}</MenuItem>
      </TextField>

      <TextField
        select
        label={t("processes.template_trigger_type")}
        value={triggerType}
        onChange={(e) => onTriggerTypeChange(e.target.value as ProcessTriggerType)}
        size="small"
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="manual">{t("processes.trigger.manual")}</MenuItem>
        <MenuItem value="status_change">{t("processes.trigger.status_change")}</MenuItem>
        <MenuItem value="field_change">{t("processes.trigger.field_change")}</MenuItem>
        <MenuItem value="date_field">{t("processes.trigger.date_field")}</MenuItem>
      </TextField>

      {triggerType === "status_change" && (
        <>
          <TextField
            label="From Status"
            value={(triggerConfig.from_status as string) ?? ""}
            onChange={(e) => updateConfig("from_status", e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          />
          <TextField
            label="To Status"
            value={(triggerConfig.to_status as string) ?? ""}
            onChange={(e) => updateConfig("to_status", e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          />
        </>
      )}

      {triggerType === "field_change" && (
        <>
          <TextField
            label="Field"
            value={(triggerConfig.field as string) ?? ""}
            onChange={(e) => updateConfig("field", e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          />
          <TextField
            label="New Value"
            value={(triggerConfig.value as string) ?? ""}
            onChange={(e) => updateConfig("value", e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          />
        </>
      )}

      {triggerType === "date_field" && (
        <>
          <TextField
            label="Date Field"
            value={(triggerConfig.date_field as string) ?? ""}
            onChange={(e) => updateConfig("date_field", e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="Days Before"
            type="number"
            value={(triggerConfig.days_before as number) ?? ""}
            onChange={(e) => updateConfig("days_before", Number(e.target.value) || 0)}
            size="small"
            sx={{ minWidth: 120 }}
          />
        </>
      )}
    </Box>
  );
}
