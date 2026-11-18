import { afterEach, describe, expect, it, vi } from "vitest";
import { initialProblems } from "../features/library/data/fixtures";
import { readBrowserImport } from "./browserImport";

const fixture = initialProblems[0];
const practice = {
  id: "01000000-0000-4000-8000-000000000001",
  date: "2026-11-01",
};
const savedProgress = {
  status: "In progress",
  needsReview: !fixture.needsReview,
};

function mockStorage(progress: string, imported?: string) {
  const values = new Map([["patterna.library.v1", progress]]);
  if (imported) {
    values.set("patterna.browser-import.v1", imported);
    values.set("patterna.browser-import.completed.v1", imported);
  }
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
  });
}

function legacyHistory(history: unknown[]) {
  return JSON.stringify({ [fixture.id]: { ...savedProgress, history } });
}

afterEach(() => vi.unstubAllGlobals());

describe("browser import", () => {
  it("reports unreadable browser progress", () => {
    mockStorage("{broken json");
    expect(() => readBrowserImport()).toThrow();
  });

  it("reports a damaged practice instead of dropping that problem's progress", () => {
    mockStorage(legacyHistory([practice, { id: "bad", date: "2026-02-30" }]));
    expect(() => readBrowserImport()).toThrow();
  });

  it("reports conflicting dates for the same legacy practice", () => {
    mockStorage(legacyHistory([practice, { ...practice, date: "2026-11-02" }]));
    expect(() => readBrowserImport()).toThrow();
  });

  it("reports an unrecognized practice ID outside the sample data", () => {
    mockStorage(legacyHistory([{ ...practice, id: "unknown" }]));
    expect(() => readBrowserImport()).toThrow();
  });

  it("imports valid progress and one copy of a repeated practice", () => {
    mockStorage(legacyHistory([...fixture.history, practice, practice]));
    const result = readBrowserImport();
    expect(result?.progress).toEqual([{ ...savedProgress, problemId: fixture.id }]);
    expect(result?.practices).toEqual([{ ...practice, problemId: fixture.id }]);
  });

  it("leaves a completed import alone even if the old storage is now unreadable", () => {
    mockStorage("{broken json", "01000000-0000-4000-8000-000000000002");
    expect(readBrowserImport()).toBeNull();
  });
});
