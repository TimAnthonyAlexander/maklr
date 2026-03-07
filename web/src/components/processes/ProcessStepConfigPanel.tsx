import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Divider,
} from "@mui/material";
import { Trash2 } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import type { ProcessStep } from "../../api/types";

const STEP_TYPES = [
  "start",
  "end",
  "create_task",
  "send_email",
  "change_field",
  "wait_days",
  "decision",
  "create_appointment",
] as const;

interface ProcessStepConfigPanelProps {
  step: ProcessStep;
  onChange: (updated: ProcessStep) => void;
  onDelete: (stepKey: string) => void;
}

export function ProcessStepConfigPanel({
  step,
  onChange,
  onDelete,
}: ProcessStepConfigPanelProps) {
  const { t } = useTranslation();

  const updateField = (field: string, value: unknown) => {
    onChange({ ...step, [field]: value });
  };

  const updateConfig = (field: string, value: unknown) => {
    onChange({ ...step, config: { ...step.config, [field]: value } });
  };

  return (
    <Box sx={{ p: 2, width: 280, borderLeft: "1px solid", borderColor: "divider", overflowY: "auto" }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
        {t("processes.builder.step_config")}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label={t("processes.builder.step_label")}
          value={step.label}
          onChange={(e) => updateField("label", e.target.value)}
          size="small"
          fullWidth
        />

        <TextField
          select
          label={t("processes.builder.step_type")}
          value={step.type}
          onChange={(e) => updateField("type", e.target.value)}
          size="small"
          fullWidth
        >
          {STEP_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {t(`processes.step_types.${type}`)}
            </MenuItem>
          ))}
        </TextField>

        {step.type === "create_task" && (
          <>
            <TextField
              label={t("processes.builder.task_title")}
              value={step.config?.title ?? ""}
              onChange={(e) => updateConfig("title", e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              select
              label={t("processes.builder.task_priority")}
              value={step.config?.priority ?? "medium"}
              onChange={(e) => updateConfig("priority", e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
            <TextField
              label={t("processes.builder.deadline_days")}
              type="number"
              value={step.deadline_days ?? ""}
              onChange={(e) => updateField("deadline_days", Number(e.target.value) || undefined)}
              size="small"
              fullWidth
            />
          </>
        )}

        {step.type === "send_email" && (
          <>
            <TextField
              label={t("processes.builder.email_subject")}
              value={step.config?.subject ?? ""}
              onChange={(e) => updateConfig("subject", e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label={t("processes.builder.email_template")}
              value={step.config?.template_id ?? ""}
              onChange={(e) => updateConfig("template_id", e.target.value)}
              size="small"
              fullWidth
            />
          </>
        )}

        {step.type === "change_field" && (
          <>
            <TextField
              label={t("processes.builder.field_name")}
              value={step.config?.field ?? ""}
              onChange={(e) => updateConfig("field", e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label={t("processes.builder.field_value")}
              value={step.config?.value ?? ""}
              onChange={(e) => updateConfig("value", e.target.value)}
              size="small"
              fullWidth
            />
          </>
        )}

        {step.type === "wait_days" && (
          <TextField
            label={t("processes.builder.wait_days")}
            type="number"
            value={step.config?.days ?? ""}
            onChange={(e) => updateConfig("days", Number(e.target.value) || undefined)}
            size="small"
            fullWidth
          />
        )}

        {step.type === "decision" && (
          <>
            <TextField
              label={t("processes.builder.condition_field")}
              value={step.config?.field ?? ""}
              onChange={(e) => updateConfig("field", e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              select
              label={t("processes.builder.condition_operator")}
              value={step.config?.operator ?? "equals"}
              onChange={(e) => updateConfig("operator", e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="equals">Equals</MenuItem>
              <MenuItem value="not_equals">Not Equals</MenuItem>
              <MenuItem value="contains">Contains</MenuItem>
              <MenuItem value="greater_than">Greater Than</MenuItem>
              <MenuItem value="less_than">Less Than</MenuItem>
            </TextField>
            <TextField
              label={t("processes.builder.condition_value")}
              value={step.config?.value ?? ""}
              onChange={(e) => updateConfig("value", e.target.value)}
              size="small"
              fullWidth
            />
          </>
        )}

        {step.type === "create_appointment" && (
          <>
            <TextField
              label={t("processes.builder.task_title")}
              value={step.config?.title ?? ""}
              onChange={(e) => updateConfig("title", e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label={t("processes.builder.deadline_days")}
              type="number"
              value={step.deadline_days ?? ""}
              onChange={(e) => updateField("deadline_days", Number(e.target.value) || undefined)}
              size="small"
              fullWidth
            />
          </>
        )}
      </Box>

      {step.type !== "start" && step.type !== "end" && (
        <>
          <Divider sx={{ my: 2 }} />
          <Button
            size="small"
            color="error"
            startIcon={<Trash2 size={16} />}
            onClick={() => onDelete(step.key)}
            fullWidth
          >
            {t("processes.builder.delete_step")}
          </Button>
        </>
      )}
    </Box>
  );
}
