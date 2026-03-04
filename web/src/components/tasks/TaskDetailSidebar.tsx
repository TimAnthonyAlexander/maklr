import {
  Box,
  Typography,
  Divider,
  Chip,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import type { TaskWithRelations } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

interface TaskDetailSidebarProps {
  task: TaskWithRelations;
  onFieldSave: (field: string, value: string | null) => Promise<void>;
}

const STATUS_KEYS = ["open", "in_progress", "done", "cancelled"] as const;
const PRIORITY_KEYS = ["low", "medium", "high", "urgent"] as const;
const TYPE_KEYS = [
  "task",
  "follow_up",
  "viewing",
  "call",
  "document_request",
  "maintenance",
] as const;

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export function TaskDetailSidebar({
  task,
  onFieldSave,
}: TaskDetailSidebarProps) {
  const { t } = useTranslation();
  const assignees = task.task_users ?? [];

  const handleSelectChange = (field: string) => (e: SelectChangeEvent) => {
    const newValue = e.target.value;
    onFieldSave(field, newValue);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFieldSave("due_date", value || null);
  };

  return (
    <Box
      sx={{
        borderLeft: "1px solid",
        borderColor: "divider",
        pl: 3,
        minWidth: 220,
      }}
    >
      <Field label={t("tasks.detail.status")}>
        <Select
          value={task.status ?? "open"}
          onChange={handleSelectChange("status")}
          size="small"
          fullWidth
          variant="outlined"
          sx={{ fontSize: "0.875rem" }}
        >
          {STATUS_KEYS.map((key) => (
            <MenuItem key={key} value={key}>
              {t(`tasks.status.${key}`)}
            </MenuItem>
          ))}
        </Select>
      </Field>

      <Field label={t("tasks.detail.priority")}>
        <Select
          value={task.priority ?? "medium"}
          onChange={handleSelectChange("priority")}
          size="small"
          fullWidth
          variant="outlined"
          sx={{ fontSize: "0.875rem" }}
        >
          {PRIORITY_KEYS.map((key) => (
            <MenuItem key={key} value={key}>
              {t(`tasks.priority.${key}`)}
            </MenuItem>
          ))}
        </Select>
      </Field>

      <Field label={t("tasks.detail.type")}>
        <Select
          value={task.type ?? "task"}
          onChange={handleSelectChange("type")}
          size="small"
          fullWidth
          variant="outlined"
          sx={{ fontSize: "0.875rem" }}
        >
          {TYPE_KEYS.map((key) => (
            <MenuItem key={key} value={key}>
              {t(`tasks.type.${key}`)}
            </MenuItem>
          ))}
        </Select>
      </Field>

      <Divider sx={{ my: 2 }} />

      <Field label={t("tasks.detail.due_date")}>
        <TextField
          type="date"
          size="small"
          fullWidth
          value={task.due_date ?? ""}
          onChange={handleDateChange}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ "& input": { fontSize: "0.875rem" } }}
        />
      </Field>

      <Field label={t("tasks.detail.assignees")}>
        {assignees.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("tasks.detail.unassigned")}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {assignees.map((tu) => (
              <Chip
                key={tu.id}
                label={tu.user?.name ?? t("tasks.detail.unknown_user")}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Field>

      <Divider sx={{ my: 2 }} />

      {task.estate && (
        <Field label={t("tasks.detail.estate")}>
          <Typography variant="body2">
            {(task.estate as { title?: string }).title ??
              task.estate_id ??
              "\u2014"}
          </Typography>
        </Field>
      )}

      {task.contact && (
        <Field label={t("tasks.detail.contact")}>
          <Typography variant="body2">
            {(task.contact as { name?: string }).name ??
              task.contact_id ??
              "\u2014"}
          </Typography>
        </Field>
      )}

      <Divider sx={{ my: 2 }} />

      <Field label={t("tasks.detail.created")}>
        <Typography variant="body2">
          {formatDateTime(task.created_at)}
        </Typography>
      </Field>

      <Field label={t("tasks.detail.updated")}>
        <Typography variant="body2">
          {formatDateTime(task.updated_at)}
        </Typography>
      </Field>
    </Box>
  );
}
