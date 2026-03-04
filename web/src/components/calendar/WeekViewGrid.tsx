import { useRef, useEffect, useMemo, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import type { Appointment } from "../../api/types";
import {
  isSameDay,
  fromApiDatetime,
  eventToGridPosition,
  computeOverlapLayout,
} from "../../utils/dateUtils";
import { WeekViewEvent } from "./WeekViewEvent";

interface WeekViewGridProps {
  weekDays: Date[];
  appointments: Appointment[];
  startHour: number;
  endHour: number;
  onSlotClick: (datetime: Date) => void;
  onEventClick: (appointment: Appointment) => void;
}

const HOUR_HEIGHT = 60;

export function WeekViewGrid({
  weekDays,
  appointments,
  startHour,
  endHour,
  onSlotClick,
  onEventClick,
}: WeekViewGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [startHour]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<number, Appointment[]>();
    for (let i = 0; i < 7; i++) {
      map.set(i, []);
    }

    for (const apt of appointments) {
      if (!apt.starts_at) continue;
      const start = fromApiDatetime(apt.starts_at);
      for (let i = 0; i < 7; i++) {
        if (isSameDay(start, weekDays[i])) {
          map.get(i)!.push(apt);
          break;
        }
      }
    }

    return map;
  }, [appointments, weekDays]);

  const handleCellClick = useCallback(
    (dayIdx: number, hour: number) => {
      const date = new Date(weekDays[dayIdx]);
      date.setHours(hour, 0, 0, 0);
      onSlotClick(date);
    },
    [weekDays, onSlotClick],
  );

  return (
    <Box
      ref={scrollRef}
      sx={{
        flex: 1,
        overflow: "auto",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "56px repeat(7, 1fr)",
          position: "relative",
          minHeight: hours.length * HOUR_HEIGHT,
        }}
      >
        {/* Hour labels column */}
        <Box sx={{ position: "relative" }}>
          {hours.map((hour) => (
            <Box
              key={hour}
              sx={{
                height: HOUR_HEIGHT,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                pr: 1,
                pt: "-6px",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: 10,
                  lineHeight: 1,
                  transform: "translateY(-6px)",
                }}
              >
                {hour === startHour
                  ? ""
                  : `${String(hour).padStart(2, "0")}:00`}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Day columns */}
        {weekDays.map((_, dayIdx) => (
          <Box
            key={dayIdx}
            sx={{
              position: "relative",
              borderLeft: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* Hour cells (click targets) */}
            {hours.map((hour) => (
              <Box
                key={hour}
                onClick={() => handleCellClick(dayIdx, hour)}
                sx={{
                  height: HOUR_HEIGHT,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                }}
              />
            ))}

            {/* Events overlay */}
            {(() => {
              const dayAppts = appointmentsByDay.get(dayIdx) ?? [];
              const layout = computeOverlapLayout(dayAppts);
              return dayAppts.map((apt, aptIdx) => {
                if (!apt.starts_at || !apt.ends_at) return null;
                const pos = eventToGridPosition(
                  apt.starts_at,
                  apt.ends_at,
                  HOUR_HEIGHT,
                );
                const top = pos.top - startHour * HOUR_HEIGHT;
                const height = pos.height;
                const placement = layout.get(aptIdx);
                return (
                  <WeekViewEvent
                    key={apt.id}
                    appointment={apt}
                    top={top}
                    height={height}
                    columnIndex={placement?.columnIndex ?? 0}
                    totalColumns={placement?.totalColumns ?? 1}
                    onClick={onEventClick}
                  />
                );
              });
            })()}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
