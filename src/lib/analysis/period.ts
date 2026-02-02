const DEFAULT_PERIOD_DAYS = 7;
const ALLOWED_PERIOD_DAYS = [3, 7, 14];

const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfUtcDay(next);
};

export const normalizePeriodDays = (value?: string | number | null) => {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!numeric || Number.isNaN(numeric)) return DEFAULT_PERIOD_DAYS;
  if (ALLOWED_PERIOD_DAYS.includes(numeric)) return numeric;
  return DEFAULT_PERIOD_DAYS;
};

export const buildPeriodRange = (endDate: Date, days: number) => {
  const end = startOfUtcDay(endDate);
  const start = addUtcDays(end, -(days - 1));
  const prevEnd = addUtcDays(start, -1);
  const prevStart = addUtcDays(prevEnd, -(days - 1));

  return {
    days,
    current: { start, end },
    previous: { start: prevStart, end: prevEnd },
  };
};

export const isWithinRange = (
  date: Date,
  range: { start: Date; end: Date },
) => {
  return date >= range.start && date <= range.end;
};
