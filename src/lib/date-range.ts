export type DateRangeKey = "today" | "week" | "month" | "year" | "all" | "custom";

export const DATE_RANGE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

export interface CustomRange {
  start: string;
  end: string;
}

export interface PeriodBounds {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  label: string;
}

export function getPeriodBounds(key: DateRangeKey, now: Date = new Date(), custom?: CustomRange): PeriodBounds | null {
  if (key === "all") return null;

  if (key === "custom") {
    if (!custom?.start || !custom?.end) return null;
    const start = new Date(`${custom.start}T00:00:00`);
    const end = new Date(`${custom.end}T00:00:00`);
    end.setDate(end.getDate() + 1); // make the end date inclusive
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
    const spanMs = end.getTime() - start.getTime();
    const previousEnd = start;
    const previousStart = new Date(start.getTime() - spanMs);
    return { start, end, previousStart, previousEnd, label: "vs previous period" };
  }

  if (key === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 1);
    return { start, end, previousStart, previousEnd: start, label: "vs yesterday" };
  }

  if (key === "week") {
    const day = now.getDay();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 7);
    return { start, end, previousStart, previousEnd: start, label: "vs last week" };
  }

  if (key === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start, end, previousStart, previousEnd: start, label: "vs last month" };
  }

  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const previousStart = new Date(now.getFullYear() - 1, 0, 1);
  return { start, end, previousStart, previousEnd: start, label: "vs last year" };
}

export function isWithin(value: string | Date | undefined, start: Date, end: Date): boolean {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date < end;
}
