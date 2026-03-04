import { useMemo, useCallback } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  getMonthGrid,
  isSameDay,
  isInWeek,
  getWeekStart,
} from "../../utils/dateUtils";
import { useTranslation } from "../../contexts/LanguageContext";

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function MiniCalendar({
  selectedDate,
  onDateSelect,
}: MiniCalendarProps) {
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const viewMonth = selectedDate.getMonth();
  const viewYear = selectedDate.getFullYear();

  const grid = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );
  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);

  const MONTH_KEYS = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const handlePrevMonth = useCallback(() => {
    const prev = new Date(viewYear, viewMonth - 1, 1);
    onDateSelect(prev);
  }, [viewYear, viewMonth, onDateSelect]);

  const handleNextMonth = useCallback(() => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    onDateSelect(next);
  }, [viewYear, viewMonth, onDateSelect]);

  return (
    <Box sx={{ userSelect: "none" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <IconButton size="small" onClick={handlePrevMonth}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 500, color: "text.primary" }}
        >
          {t(`calendar.month.${MONTH_KEYS[viewMonth]}`)} {viewYear}
        </Typography>
        <IconButton size="small" onClick={handleNextMonth}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}
      >
        {DAY_LABELS.map((label) => (
          <Box
            key={label}
            sx={{
              textAlign: "center",
              py: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: 11 }}
            >
              {label}
            </Typography>
          </Box>
        ))}

        {grid.flat().map((day, idx) => {
          const isCurrentMonth = day.getMonth() === viewMonth;
          const isToday = isSameDay(day, today);
          const inSelectedWeek = isInWeek(day, weekStart);

          return (
            <Box
              key={idx}
              onClick={() => onDateSelect(day)}
              sx={{
                textAlign: "center",
                py: 0.25,
                cursor: "pointer",
                borderRadius: 1,
                bgcolor: inSelectedWeek ? "rgba(0,0,0,0.04)" : "transparent",
                "&:hover": { bgcolor: "rgba(0,0,0,0.08)" },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  fontSize: 12,
                  fontWeight: isToday ? 600 : 400,
                  color: !isCurrentMonth
                    ? "text.disabled"
                    : isToday
                      ? "#fff"
                      : "text.primary",
                  bgcolor: isToday ? "primary.main" : "transparent",
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
