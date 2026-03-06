import { Chip } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";

const STATUS_COLORS: Record<
  string,
  "default" | "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  syncing: "info",
  synced: "success",
  error: "error",
};

interface SyncStatusChipProps {
  status: string;
}

export function SyncStatusChip({ status }: SyncStatusChipProps) {
  const { t } = useTranslation();
  const color = STATUS_COLORS[status] ?? "default";

  return (
    <Chip
      label={t(`portal.sync_status.${status}`)}
      color={color}
      size="small"
      variant="outlined"
    />
  );
}
