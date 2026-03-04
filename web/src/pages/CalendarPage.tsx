import { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import type { Appointment } from "../api/types";
import { useGetAppointmentList } from "../api/hooks";
import { getWeekStart, getWeekDays, toApiDatetime } from "../utils/dateUtils";
import { MiniCalendar } from "../components/calendar/MiniCalendar";
import { CalendarViewOptions } from "../components/calendar/CalendarViewOptions";
import { WeekViewHeader } from "../components/calendar/WeekViewHeader";
import { WeekViewGrid } from "../components/calendar/WeekViewGrid";
import { AppointmentFormDialog } from "../components/calendar/AppointmentFormDialog";
import { useTranslation } from "../contexts/LanguageContext";

interface DialogState {
  open: boolean;
  appointment: Appointment | null;
  initialDateTime: Date | null;
}

export function CalendarPage() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [startHour, setStartHour] = useState(() => {
    const stored = localStorage.getItem("calendar.startHour");
    return stored !== null ? Number(stored) : 7;
  });
  const [endHour, setEndHour] = useState(() => {
    const stored = localStorage.getItem("calendar.endHour");
    return stored !== null ? Number(stored) : 20;
  });

  useEffect(() => {
    localStorage.setItem("calendar.startHour", String(startHour));
  }, [startHour]);

  useEffect(() => {
    localStorage.setItem("calendar.endHour", String(endHour));
  }, [endHour]);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    appointment: null,
    initialDateTime: null,
  });

  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const queryParams = useMemo(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return {
      starts_after: toApiDatetime(weekStart),
      starts_before: toApiDatetime(weekEnd),
      per_page: 200,
    };
  }, [weekStart]);

  const { data, loading, refetch } = useGetAppointmentList(queryParams);
  const appointments = data?.items ?? [];

  const handlePrevWeek = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handleSlotClick = useCallback((datetime: Date) => {
    setDialog({ open: true, appointment: null, initialDateTime: datetime });
  }, []);

  const handleEventClick = useCallback((appointment: Appointment) => {
    setDialog({ open: true, appointment, initialDateTime: null });
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialog({ open: false, appointment: null, initialDateTime: null });
  }, []);

  const handleSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Box
      sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t("calendar.page.title")}
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flex: 1, minHeight: 0 }}>
        <Box sx={{ width: 260, flexShrink: 0 }}>
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
          <CalendarViewOptions
            startHour={startHour}
            endHour={endHour}
            onStartHourChange={setStartHour}
            onEndHourChange={setEndHour}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <WeekViewHeader
            weekDays={weekDays}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onToday={handleToday}
          />

          {loading && appointments.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <WeekViewGrid
              weekDays={weekDays}
              appointments={appointments}
              startHour={startHour}
              endHour={endHour}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
            />
          )}
        </Box>
      </Box>

      <AppointmentFormDialog
        open={dialog.open}
        onClose={handleDialogClose}
        appointment={dialog.appointment}
        initialDateTime={dialog.initialDateTime}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}
