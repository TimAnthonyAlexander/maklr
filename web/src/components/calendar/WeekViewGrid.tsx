import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { Box, Typography } from "@mui/material";
import type { Appointment } from "../../api/types";
import {
  isSameDay,
  fromApiDatetime,
  eventToGridPosition,
  computeOverlapLayout,
} from "../../utils/dateUtils";
import { WeekViewEvent } from "./WeekViewEvent";
import { AllDayEvent } from "./AllDayEvent";

interface WeekViewGridProps {
  weekDays: Date[];
  appointments: Appointment[];
  startHour: number;
  endHour: number;
  onSlotClick: (datetime: Date) => void;
  onEventClick: (appointment: Appointment) => void;
}

const HOUR_HEIGHT = 60;

function useCurrentTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function WeekViewGrid({
  weekDays,
  appointments,
  startHour,
  endHour,
  onSlotClick,
  onEventClick,
}: WeekViewGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useCurrentTime();
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [startHour]);

  const { timedByDay, allDayByDay, hasAllDay } = useMemo(() => {
    const timed = new Map<number, Appointment[]>();
    const allDay = new Map<number, Appointment[]>();
    for (let i = 0; i < 7; i++) {
      timed.set(i, []);
      allDay.set(i, []);
    }

    for (const apt of appointments) {
      if (!apt.starts_at) continue;
      const start = fromApiDatetime(apt.starts_at);
      const target = apt.is_all_day ? allDay : timed;
      for (let i = 0; i < 7; i++) {
        if (isSameDay(start, weekDays[i])) {
          target.get(i)!.push(apt);
          break;
        }
      }
    }

    let found = false;
    for (let i = 0; i < 7; i++) {
      if (allDay.get(i)!.length > 0) {
        found = true;
        break;
      }
    }

    return { timedByDay: timed, allDayByDay: allDay, hasAllDay: found };
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
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* All-day header */}
      {hasAllDay && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "56px repeat(7, 1fr)",
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Box />
          {weekDays.map((_, dayIdx) => (
            <Box
              key={dayIdx}
              sx={{
                borderLeft: "1px solid",
                borderColor: "divider",
                px: 0.5,
                py: 0.5,
                minHeight: 28,
              }}
            >
              {(allDayByDay.get(dayIdx) ?? []).map((apt) => (
                <AllDayEvent
                  key={apt.id}
                  appointment={apt}
                  onClick={onEventClick}
                />
              ))}
            </Box>
          ))}
        </Box>
      )}

      {/* Scrollable time grid */}
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
              const dayAppts = timedByDay.get(dayIdx) ?? [];
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

            {/* Current time indicator */}
            {isSameDay(now, weekDays[dayIdx]) &&
              now.getHours() >= startHour &&
              now.getHours() < endHour && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top:
                      (now.getHours() - startHour + now.getMinutes() / 60) *
                      HOUR_HEIGHT,
                    zIndex: 3,
                    pointerEvents: "none",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: -5,
                      top: -5,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                    }}
                  />
                  <Box
                    sx={{
                      height: "2px",
                      bgcolor: "error.main",
                    }}
                  />
                </Box>
              )}
          </Box>
        ))}
      </Box>
      </Box>
    </Box>
  );
}
