export function getWeekStartIso(date = new Date()) {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  return monday.toISOString();
}

export function getWeekRangeFromStart(weekStart: string) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    weekLabel: formatWeekLabel(start, end),
  };
}

export function getCurrentWeekRange() {
  return getWeekRangeFromStart(getWeekStartIso());
}

export function shiftWeekStart(weekStart: string, weeks: number) {
  const start = new Date(weekStart);
  start.setDate(start.getDate() + weeks * 7);
  start.setHours(0, 0, 0, 0);

  return start.toISOString();
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
  return new Date() > new Date(weekEnd);
}
