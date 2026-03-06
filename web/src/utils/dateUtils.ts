/**
 * Get Monday of the week containing the given date.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get an array of 7 Date objects (Mon–Sun) starting from weekStart.
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * Get a 6-row grid of dates for a month calendar.
 * Each row has 7 days (Mon–Sun). Includes padding days from adjacent months.
 */
export function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const startDay = getWeekStart(firstDay);

  const rows: Date[][] = [];
  const current = new Date(startDay);

  for (let row = 0; row < 6; row++) {
    const week: Date[] = [];
    for (let col = 0; col < 7; col++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    rows.push(week);
  }

  return rows;
}

/**
 * Check if two dates are the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if a date falls within the week starting at weekStart.
 */
export function isInWeek(date: Date, weekStart: Date): boolean {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

/**
 * Format a Date to API datetime string (YYYY-MM-DD HH:MM:SS).
 */
export function toApiDatetime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

/**
 * Parse an API datetime string to a Date object.
 */
export function fromApiDatetime(s: string): Date {
  return new Date(s.replace(" ", "T"));
}

/**
 * Convert an event's start/end times to CSS grid position values.
 * Returns top (px) and height (px) for a 60px-per-hour grid.
 */
export function eventToGridPosition(
  startsAt: string,
  endsAt: string,
  hourHeight: number = 60,
): { top: number; height: number } {
  const start = fromApiDatetime(startsAt);
  const end = fromApiDatetime(endsAt);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const duration = Math.max(endMinutes - startMinutes, 15);

  const top = (startMinutes / 60) * hourHeight;
  const height = (duration / 60) * hourHeight;

  return { top, height };
}

/**
 * Format a Date to datetime-local input value (YYYY-MM-DDTHH:MM).
 */
export function toDatetimeLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

/**
 * Layout info for a single event in an overlap group.
 */
export interface EventLayout {
  /** Zero-based column index within the overlap group */
  columnIndex: number;
  /** Total number of columns in the overlap group */
  totalColumns: number;
}

/**
 * Compute side-by-side layout for overlapping events (Apple Calendar style).
 * Returns a Map from event index to its column placement.
 */
export function computeOverlapLayout<T extends { starts_at?: string | null; ends_at?: string | null }>(
  events: T[],
): Map<number, EventLayout> {
  const result = new Map<number, EventLayout>();

  if (events.length === 0) return result;

  // Parse time ranges
  const parsed = events.map((evt, idx) => {
    const start = evt.starts_at ? fromApiDatetime(evt.starts_at) : new Date();
    const end = evt.ends_at ? fromApiDatetime(evt.ends_at) : new Date();
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    return { idx, startMin, endMin: Math.max(endMin, startMin + 15) };
  });

  // Sort by start time, then by duration descending (longer events first)
  const sorted = [...parsed].sort((a, b) =>
    a.startMin !== b.startMin
      ? a.startMin - b.startMin
      : (b.endMin - b.startMin) - (a.endMin - a.startMin),
  );

  // Greedy column assignment: each event goes in the first column that doesn't conflict
  const columns: { endMin: number }[][] = [];

  for (const event of sorted) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (lastInCol.endMin <= event.startMin) {
        columns[col].push(event);
        result.set(event.idx, { columnIndex: col, totalColumns: 0 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
      result.set(event.idx, { columnIndex: columns.length - 1, totalColumns: 0 });
    }
  }

  // Build overlap groups to determine totalColumns for each event
  // Two events are in the same group if they overlap transitively
  const visited = new Set<number>();

  for (const event of sorted) {
    if (visited.has(event.idx)) continue;

    // BFS to find all events connected by overlap
    const group: typeof sorted = [];
    const queue = [event];
    visited.add(event.idx);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);

      for (const other of sorted) {
        if (visited.has(other.idx)) continue;
        // Check if `other` overlaps with any event already in the group
        const overlapsWithGroup = group.some(
          (g) => g.startMin < other.endMin && other.startMin < g.endMin,
        );
        if (overlapsWithGroup) {
          visited.add(other.idx);
          queue.push(other);
        }
      }
    }

    // Find max column index in this group
    let maxCol = 0;
    for (const member of group) {
      const layout = result.get(member.idx)!;
      maxCol = Math.max(maxCol, layout.columnIndex);
    }
    const totalColumns = maxCol + 1;

    for (const member of group) {
      const layout = result.get(member.idx)!;
      result.set(member.idx, { ...layout, totalColumns });
    }
  }

  return result;
}

/**
 * Format a Date to a date-only API string (YYYY-MM-DD 00:00:00).
 */
export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d} 00:00:00`;
}

/**
 * Format a Date to a date-only end-of-day API string (YYYY-MM-DD 23:59:59).
 */
export function toDateOnlyEnd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d} 23:59:59`;
}

/**
 * Format a Date to a date input value (YYYY-MM-DD).
 */
export function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format a time range for display (e.g., "09:00 – 10:00").
 */
export function formatTimeRange(startsAt: string, endsAt: string): string {
  const start = fromApiDatetime(startsAt);
  const end = fromApiDatetime(endsAt);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${fmt(start)} \u2013 ${fmt(end)}`;
}
