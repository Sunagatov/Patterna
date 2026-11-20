const millisecondsPerDay = 86_400_000;

export const monthLabel = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function monthStart(month: string): Date {
  return new Date(`${month}-01T00:00:00Z`);
}

export function moveMonth(month: string, offset: number): string {
  const date = monthStart(month);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function practiceStreaks(dates: Iterable<string>, today: string) {
  const days = [...new Set(dates)].filter((date) => date <= today).sort();
  let previousDay = -Infinity;
  let run = 0;
  let best = 0;
  for (const date of days) {
    const day = Date.parse(date) / millisecondsPerDay;
    run = day === previousDay + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previousDay = day;
  }
  const currentDay = Date.parse(today) / millisecondsPerDay;
  return { current: currentDay - previousDay <= 1 ? run : 0, best };
}
