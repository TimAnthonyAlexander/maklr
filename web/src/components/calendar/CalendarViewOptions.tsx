import { useCallback } from "react";
import { Box, Typography, Select, MenuItem } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";

interface CalendarViewOptionsProps {
  startHour: number;
  endHour: number;
  onStartHourChange: (hour: number) => void;
  onEndHourChange: (hour: number) => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function CalendarViewOptions({
  startHour,
  endHour,
  onStartHourChange,
  onEndHourChange,
}: CalendarViewOptionsProps) {
  const { t } = useTranslation();

  const handleStartChange = useCallback(
    (e: SelectChangeEvent<number>) => {
      onStartHourChange(Number(e.target.value));
    },
    [onStartHourChange],
  );

  const handleEndChange = useCallback(
    (e: SelectChangeEvent<number>) => {
      onEndHourChange(Number(e.target.value));
    },
    [onEndHourChange],
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{ mb: 1.5, color: "text.secondary", fontSize: 12 }}
      >
        {t("calendar.view_options.title")}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", mb: 0.5, display: "block" }}
          >
            {t("calendar.view_options.start_hour")}
          </Typography>
          <Select
            size="small"
            value={startHour}
            onChange={handleStartChange}
            fullWidth
            sx={{ fontSize: 13 }}
          >
            {HOUR_OPTIONS.filter((h) => h < endHour).map((h) => (
              <MenuItem key={h} value={h} sx={{ fontSize: 13 }}>
                {formatHour(h)}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", mb: 0.5, display: "block" }}
          >
            {t("calendar.view_options.end_hour")}
          </Typography>
          <Select
            size="small"
            value={endHour}
            onChange={handleEndChange}
            fullWidth
            sx={{ fontSize: 13 }}
          >
            {HOUR_OPTIONS.filter((h) => h > startHour).map((h) => (
              <MenuItem key={h} value={h} sx={{ fontSize: 13 }}>
                {formatHour(h)}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>
    </Box>
  );
}
