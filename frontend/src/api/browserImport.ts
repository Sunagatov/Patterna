import { initialProblems } from "../features/library/data/fixtures";
import { readProblems } from "../features/library/storage";
import { loadSolutions } from "../features/problem/solutions";
import type { BrowserImport } from "./client";

const importKey = "patterna.browser-import.v1";
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export function readBrowserImport(): BrowserImport | null {
  const problems = readProblems();
  const progress: BrowserImport["progress"] = [];
  const practices: BrowserImport["practices"] = [];
  for (const [index, problem] of problems.entries()) {
    const fixture = initialProblems[index];
    const status =
      problem.status !== fixture.status ? problem.status : undefined;
    const needsReview =
      problem.needsReview !== fixture.needsReview
        ? problem.needsReview
        : undefined;
    if (status !== undefined || needsReview !== undefined)
      progress.push({ problemId: problem.id, status, needsReview });
    practices.push(
      ...problem.history
        .filter((entry) => uuid.test(entry.id))
        .map((entry) => ({ ...entry, problemId: problem.id })),
    );
  }
  const solutions = loadSolutions(localStorage);
  if (!progress.length && !practices.length && !solutions.length) return null;
  const savedId = localStorage.getItem(importKey);
  if (
    savedId &&
    localStorage.getItem("patterna.browser-import.completed.v1") === savedId
  )
    return null;
  const id = savedId && uuid.test(savedId) ? savedId : crypto.randomUUID();
  return { id, progress, practices, solutions };
}

export function rememberBrowserImport(id: string) {
  localStorage.setItem(importKey, id);
}
