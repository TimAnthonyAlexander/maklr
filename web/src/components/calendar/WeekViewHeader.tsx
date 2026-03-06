import { useMemo } from "react";
import { Box, Typography, Button } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isSameDay } from "../../utils/dateUtils";
import { useTranslation } from "../../contexts/LanguageContext";

interface WeekViewHeaderProps {
  weekDays: Date[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function WeekViewHeader({
  weekDays,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekViewHeaderProps) {
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Button size="small" variant="outlined" onClick={onToday}>
          {t("calendar.today")}
        </Button>
        <Button size="small" onClick={onPrevWeek} sx={{ minWidth: 32, p: 0.5 }}>
          <ChevronLeft size={20} />
        </Button>
        <Button size="small" onClick={onNextWeek} sx={{ minWidth: 32, p: 0.5 }}>
          <ChevronRight size={20} />
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "56px repeat(7, 1fr)",
          borderBottom: "1px solid",
          borderColor: "divider",
          pb: 1,
        }}
      >
        <Box />
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, today);
          return (
            <Box key={idx} sx={{ textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{
                  color: isToday ? "primary.main" : "text.secondary",
                  fontWeight: isToday ? 600 : 400,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t(`calendar.day.${DAY_KEYS[idx]}`)}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: isToday ? 600 : 400,
                  color: isToday ? "#fff" : "text.primary",
                  bgcolor: isToday ? "primary.main" : "transparent",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                {day.getDate()}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
