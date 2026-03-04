import { Box, Typography } from "@mui/material";
import type { Appointment } from "../../api/types";
import { formatTimeRange } from "../../utils/dateUtils";
import { colors } from "../../theme/colors";

interface WeekViewEventProps {
  appointment: Appointment;
  top: number;
  height: number;
  columnIndex: number;
  totalColumns: number;
  onClick: (appointment: Appointment) => void;
}

const TYPE_COLORS: Record<string, string> = {
  viewing: colors.calendar.viewing,
  meeting: colors.calendar.meeting,
  call: colors.calendar.call,
  handover: colors.calendar.handover,
  inspection: colors.calendar.inspection,
  open_house: colors.calendar.open_house,
  signing: colors.calendar.signing,
  valuation: colors.calendar.valuation,
  photography: colors.calendar.photography,
  other: colors.calendar.other,
};

export function WeekViewEvent({
  appointment,
  top,
  height,
  columnIndex,
  totalColumns,
  onClick,
}: WeekViewEventProps) {
  const color = TYPE_COLORS[appointment.type ?? "other"] ?? TYPE_COLORS.other;
  const minHeight = Math.max(height, 20);

  const widthPercent = 100 / totalColumns;
  const leftPercent = columnIndex * widthPercent;

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        onClick(appointment);
      }}
      sx={{
        position: "absolute",
        top,
        left: `calc(${leftPercent}% + 1px)`,
        width: `calc(${widthPercent}% - 2px)`,
        height: minHeight,
        bgcolor: `${color}14`,
        borderLeft: `3px solid ${color}`,
        borderRadius: "4px",
        px: 0.75,
        py: 0.25,
        cursor: "pointer",
        overflow: "hidden",
        zIndex: columnIndex + 1,
        "&:hover": {
          bgcolor: `${color}24`,
          zIndex: 10,
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 500,
          fontSize: 11,
          lineHeight: 1.3,
          color: "text.primary",
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {appointment.title}
      </Typography>
      {minHeight > 30 && appointment.starts_at && appointment.ends_at && (
        <Typography
          variant="caption"
          sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1.2 }}
        >
          {formatTimeRange(appointment.starts_at, appointment.ends_at)}
        </Typography>
      )}
    </Box>
  );
}
