import { Chip } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";
import { colors } from "../../theme/colors";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  open: { bg: colors.status.info.bg, color: colors.status.info.text },
  in_progress: { bg: colors.status.warning.bg, color: colors.status.warning.text },
  done: { bg: colors.status.success.bg, color: colors.status.success.text },
  cancelled: { bg: colors.status.neutral.bg, color: colors.status.neutral.text },
};

const STATUS_KEYS: Record<string, string> = {
  open: "tasks.status.open",
  in_progress: "tasks.status.in_progress",
  done: "tasks.status.done",
  cancelled: "tasks.status.cancelled",
};

const PRIORITY_COLORS: Record<string, { border: string; color: string }> = {
  low: { border: colors.priority.low.border, color: colors.priority.low.text },
  medium: { border: colors.priority.medium.border, color: colors.priority.medium.text },
  high: { border: colors.priority.high.border, color: colors.priority.high.text },
  urgent: { border: colors.priority.urgent.border, color: colors.priority.urgent.text },
};

const PRIORITY_KEYS: Record<string, string> = {
  low: "tasks.priority.low",
  medium: "tasks.priority.medium",
  high: "tasks.priority.high",
  urgent: "tasks.priority.urgent",
};

const TYPE_KEYS: Record<string, string> = {
  task: "tasks.type.task",
  follow_up: "tasks.type.follow_up",
  viewing: "tasks.type.viewing",
  call: "tasks.type.call",
  document_request: "tasks.type.document_request",
  maintenance: "tasks.type.maintenance",
};

interface StatusChipProps {
  status: string;
}

export function TaskStatusChip({ status }: StatusChipProps) {
  const { t } = useTranslation();
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.open;
  return (
    <Chip
      label={t(STATUS_KEYS[status] ?? status)}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.color,
        fontWeight: 500,
        fontSize: "0.75rem",
      }}
    />
  );
}

interface PriorityChipProps {
  priority: string;
}

export function TaskPriorityChip({ priority }: PriorityChipProps) {
  const { t } = useTranslation();
  const colors = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.medium;
  return (
    <Chip
      label={t(PRIORITY_KEYS[priority] ?? priority)}
      size="small"
      variant="outlined"
      sx={{
        borderColor: colors.border,
        color: colors.color,
        fontWeight: 500,
        fontSize: "0.75rem",
      }}
    />
  );
}

interface TypeLabelProps {
  value: string;
}

export function TaskTypeLabel({ value }: TypeLabelProps) {
  const { t } = useTranslation();
  return (
    <Chip
      label={t(TYPE_KEYS[value] ?? value)}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 500, fontSize: "0.75rem" }}
    />
  );
}
