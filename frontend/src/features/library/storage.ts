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
  let saved: unknown;
  try {
    saved = JSON.parse(localStorage.getItem(progressKey) ?? "null");
  } catch {
    saved = null;
  }
  const progress = isRecord(saved) ? saved : {};
  return initialProblems.map((problem) => {
    const record = progress[String(problem.id)];
    if (
      !isRecord(record) ||
      !taskStatuses.includes(record.status as TaskStatus) ||
      typeof record.needsReview !== "boolean" ||
      !Array.isArray(record.history) ||
      !record.history.every(isEntry)
    ) {
      return { ...problem, history: [...problem.history] };
    }
    const history = record.history.filter(
      (entry, index, entries) =>
        entries.findIndex((value) => value.id === entry.id) === index,
    );
    return {
      ...problem,
      status: record.status as TaskStatus,
      needsReview: record.needsReview,
      history,
    };
  });
}

export function saveProblems(problems: Problem[]): void {
  const progress = Object.fromEntries(
    problems.map(({ id, status, needsReview, history }) => [
      id,
      { status, needsReview, history },
    ]),
  );
  try {
    localStorage.setItem(progressKey, JSON.stringify(progress));
  } catch {
    /* Browser-local mock state still works for this session. */
  }
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
