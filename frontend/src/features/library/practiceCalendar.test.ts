import { expect, it } from "vitest";
import { moveMonth, practiceStreaks } from "./practiceCalendar";

it("counts distinct practice dates and keeps today's streak open until the day ends", () => {
  const dates = ["2026-10-31", "2026-11-01", "2026-11-02", "2026-11-02"];
  expect(practiceStreaks(dates, "2026-11-02")).toEqual({ current: 3, best: 3 });
  expect(practiceStreaks(dates, "2026-11-03")).toEqual({ current: 3, best: 3 });
  expect(practiceStreaks(dates, "2026-11-04")).toEqual({ current: 0, best: 3 });
});

it("retains the best streak after a gap and ignores future entries", () => {
  const dates = [
    "2024-02-28",
    "2024-02-29",
    "2024-03-01",
    "2024-03-05",
    "2024-03-06",
  ];
  expect(practiceStreaks(dates, "2024-03-05")).toEqual({ current: 1, best: 3 });
  expect(practiceStreaks([], "2024-03-05")).toEqual({ current: 0, best: 0 });
});

it("navigates across years in either direction", () => {
  expect(moveMonth("2026-12", 1)).toBe("2027-01");
  expect(moveMonth("2026-01", -1)).toBe("2025-12");
});
