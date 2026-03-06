import { Box, Typography } from "@mui/material";
import type { Appointment } from "../../api/types";
import { colors } from "../../theme/colors";

interface AllDayEventProps {
  appointment: Appointment;
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

export function AllDayEvent({ appointment, onClick }: AllDayEventProps) {
  const color = TYPE_COLORS[appointment.type ?? "other"] ?? TYPE_COLORS.other;

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        onClick(appointment);
      }}
      sx={{
        bgcolor: `${color}20`,
        borderLeft: `3px solid ${color}`,
        borderRadius: "4px",
        px: 0.75,
        py: 0.25,
        cursor: "pointer",
        overflow: "hidden",
        mb: 0.25,
        "&:hover": {
          bgcolor: `${color}30`,
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 500,
          fontSize: 11,
          lineHeight: 1.4,
          color: "text.primary",
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {appointment.title}
      </Typography>
    </Box>
  );
}
