import { Chip } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";
import { colors } from "../../theme/colors";

const INSTANCE_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  running: { bg: colors.status.info.bg, color: colors.status.info.text },
  paused: { bg: colors.status.warning.bg, color: colors.status.warning.text },
  completed: { bg: colors.status.success.bg, color: colors.status.success.text },
  cancelled: { bg: colors.status.neutral.bg, color: colors.status.neutral.text },
  failed: { bg: colors.status.error.bg, color: colors.status.error.text },
};

const INSTANCE_STATUS_KEYS: Record<string, string> = {
  running: "processes.status.running",
  paused: "processes.status.paused",
  completed: "processes.status.completed",
  cancelled: "processes.status.cancelled",
  failed: "processes.status.failed",
};

const STEP_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: colors.status.neutral.bg, color: colors.status.neutral.text },
  active: { bg: colors.status.info.bg, color: colors.status.info.text },
  completed: { bg: colors.status.success.bg, color: colors.status.success.text },
  skipped: { bg: colors.status.draft.bg, color: colors.status.draft.text },
  failed: { bg: colors.status.error.bg, color: colors.status.error.text },
};

const STEP_STATUS_KEYS: Record<string, string> = {
  pending: "processes.step_status.pending",
  active: "processes.step_status.active",
  completed: "processes.step_status.completed",
  skipped: "processes.step_status.skipped",
  failed: "processes.step_status.failed",
};

interface ProcessStatusBadgeProps {
  status: string;
}

export function ProcessStatusBadge({ status }: ProcessStatusBadgeProps) {
  const { t } = useTranslation();
  const chipColors = INSTANCE_STATUS_COLORS[status] ?? INSTANCE_STATUS_COLORS.running;
  return (
    <Chip
      label={t(INSTANCE_STATUS_KEYS[status] ?? status)}
      size="small"
      sx={{
        bgcolor: chipColors.bg,
        color: chipColors.color,
        fontWeight: 500,
        fontSize: "0.75rem",
      }}
    />
  );
}

interface StepStatusBadgeProps {
  status: string;
}

export function StepStatusBadge({ status }: StepStatusBadgeProps) {
  const { t } = useTranslation();
  const chipColors = STEP_STATUS_COLORS[status] ?? STEP_STATUS_COLORS.pending;
  return (
    <Chip
      label={t(STEP_STATUS_KEYS[status] ?? status)}
      size="small"
      sx={{
        bgcolor: chipColors.bg,
        color: chipColors.color,
        fontWeight: 500,
        fontSize: "0.75rem",
      }}
    />
  );
}
