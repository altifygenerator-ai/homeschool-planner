function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function parseLocalDate(value: string | Date) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) {
    const fallback = new Date(value);
    return new Date(
      fallback.getFullYear(),
      fallback.getMonth(),
      fallback.getDate(),
      12,
      0,
      0,
      0,
    );
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function getMondayForDate(date: Date) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const day = next.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diffToMonday);
  return next;
}

export function getWeekStartIso(date = new Date()) {
  return toLocalDateKey(getMondayForDate(date));
}

export function getWeekRangeFromStart(weekStart: string) {
  const start = parseLocalDate(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    weekStart: toLocalDateKey(start),
    weekEnd: toLocalDateKey(end),
    weekLabel: formatWeekLabel(start, end),
  };
}

export function getCurrentWeekRange() {
  return getWeekRangeFromStart(getWeekStartIso());
}

export function shiftWeekStart(weekStart: string, weeks: number) {
  const start = parseLocalDate(weekStart);
  start.setDate(start.getDate() + weeks * 7);
  return toLocalDateKey(start);
}

export function formatWeekLabel(start: Date, end: Date) {
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

export function isWeekOver(weekEnd: string) {
  const end = parseLocalDate(weekEnd);
  end.setHours(23, 59, 59, 999);
  return new Date() > end;
}
