import { initialProblems } from "./data/fixtures";
import { isValidPracticeDate } from "./library";
import { studyLists, taskStatuses } from "./types";
import type {
  LibraryListId,
  PracticeEntry,
  Problem,
  TaskStatus,
} from "./types";

const progressKey = "patterna.library.v1";
const defaultListKey = "patterna.default-list.v1";
const libraryViewKey = "patterna.library-view.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntry(value: unknown): value is PracticeEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    isValidPracticeDate(value.date)
  );
}

export function readProblems(): Problem[] {
  const progress: unknown = JSON.parse(
    localStorage.getItem(progressKey) ?? "{}",
  );
  if (!isRecord(progress)) throw new Error("Invalid saved progress");
  return initialProblems.map((problem) => {
    const record = progress[String(problem.id)];
    if (record === undefined)
      return { ...problem, history: [...problem.history] };
    if (
      !isRecord(record) ||
      !taskStatuses.includes(record.status as TaskStatus) ||
      typeof record.needsReview !== "boolean" ||
      !Array.isArray(record.history) ||
      !record.history.every(isEntry)
    ) {
      throw new Error("Invalid saved problem progress");
    }
    const practices = new Map<string, PracticeEntry>();
    for (const entry of record.history) {
      const existing = practices.get(entry.id);
      if (existing && existing.date !== entry.date)
        throw new Error("Conflicting saved practice dates");
      practices.set(entry.id, entry);
    }
    return {
      ...problem,
      status: record.status as TaskStatus,
      needsReview: record.needsReview,
      history: [...practices.values()],
    };
  });
}

export function readDefaultList(): LibraryListId | null {
  try {
    const saved = localStorage.getItem(defaultListKey);
    if (saved === "none") return null;
    return studyLists.find((list) => list.id === saved)?.id ?? "nc250";
  } catch {
    return "nc250";
  }
}

export function saveDefaultList(list: LibraryListId | null): void {
  try {
    localStorage.setItem(defaultListKey, list ?? "none");
  } catch {
    /* Preference applies for this session. */
  }
}

export function readListView(): boolean {
  try {
    return localStorage.getItem(libraryViewKey) === "list";
  } catch {
    return false;
  }
}

export function saveListView(listView: boolean): void {
  try {
    localStorage.setItem(libraryViewKey, listView ? "list" : "grouped");
  } catch {
    /* Preference applies for this session. */
  }
}
