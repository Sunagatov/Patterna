import { useMemo, useState } from "react";
import { Icon } from "../../../shared/ui/Icon";
import { formatDate, today } from "../library";
import {
  monthLabel,
  monthStart,
  moveMonth,
  practiceStreaks,
} from "../practiceCalendar";
import type { Problem } from "../types";
import "./practice-calendar.css";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "practice entry" : "practice entries"}`;
}

export function PracticeCalendar({ problems }: { problems: Problem[] }) {
  const currentDate = today();
  const currentMonth = currentDate.slice(0, 7);
  const [month, setMonth] = useState<string>();
  const [selectedDate, setSelectedDate] = useState<string>();
  const shownMonth = month ?? currentMonth;
  const practiceByDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const problem of problems) {
      for (const entry of problem.history) {
        counts.set(entry.date, (counts.get(entry.date) ?? 0) + 1);
      }
    }
    return counts;
  }, [problems]);
  const selectedCount = selectedDate
    ? practiceByDate.get(selectedDate)
    : undefined;
  if (selectedDate && selectedCount === undefined) setSelectedDate(undefined);
  const streaks = useMemo(
    () => practiceStreaks(practiceByDate.keys(), currentDate),
    [practiceByDate, currentDate],
  );

  const firstDay = monthStart(shownMonth);
  const firstColumn = (firstDay.getUTCDay() + 6) % 7;
  const lastDay = monthStart(moveMonth(shownMonth, 1));
  lastDay.setUTCDate(0);

  function showMonth(offset: number) {
    setMonth(moveMonth(shownMonth, offset));
    setSelectedDate(undefined);
  }

  return (
    <section className="practice-calendar" aria-label="Practice calendar">
      <h2>Practice calendar</h2>
      <div className="calendar-navigation">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => showMonth(-1)}
        >
          <Icon name="chevronLeft" />
        </button>
        <span aria-live="polite">{monthLabel.format(firstDay)}</span>
        <button
          type="button"
          aria-label="Next month"
          disabled={shownMonth >= currentMonth}
          onClick={() => showMonth(1)}
        >
          <Icon name="chevronRight" />
        </button>
      </div>
      <div className="calendar-grid">
        {weekdays.map((day) => (
          <span className="calendar-weekday" key={day} aria-hidden="true">
            {day}
          </span>
        ))}
        {Array.from({ length: lastDay.getUTCDate() }, (_, index) => {
          const day = index + 1;
          const date = `${shownMonth}-${String(day).padStart(2, "0")}`;
          const count = practiceByDate.get(date) ?? 0;
          const label = formatDate(date, true);
          return (
            <div
              className="calendar-cell"
              key={date}
              style={
                index === 0 ? { gridColumnStart: firstColumn + 1 } : undefined
              }
            >
              {count ? (
                <button
                  type="button"
                  className="calendar-day calendar-practised"
                  aria-label={`${label}, ${countLabel(count)}`}
                  aria-current={date === currentDate ? "date" : undefined}
                  aria-pressed={selectedDate === date}
                  onClick={() =>
                    setSelectedDate(selectedDate === date ? undefined : date)
                  }
                >
                  {day}
                </button>
              ) : (
                <time
                  className="calendar-day"
                  dateTime={date}
                  aria-current={date === currentDate ? "date" : undefined}
                  aria-label={label}
                >
                  {day}
                </time>
              )}
            </div>
          );
        })}
      </div>
      <div className="calendar-caption" aria-live="polite">
        {selectedDate && selectedCount !== undefined ? (
          <>
            {formatDate(selectedDate, true)} ·{" "}
            {countLabel(selectedCount)}
          </>
        ) : (
          <>
            <span className="calendar-key" aria-hidden="true" /> Practised
          </>
        )}
      </div>
      <dl className="calendar-streaks">
        <div>
          <dt>Current streak</dt>
          <dd>
            {streaks.current} {streaks.current === 1 ? "day" : "days"}
          </dd>
        </div>
        <div>
          <dt>Best streak</dt>
          <dd>
            {streaks.best} {streaks.best === 1 ? "day" : "days"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
