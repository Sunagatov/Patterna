export interface SolutionDraft {
  title: string;
  language: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  thoughts: string;
}

export interface SavedSolution extends SolutionDraft {
  id: string;
  problemId: number;
  createdAt: string;
  updatedAt: string;
}

export const emptySolution = (): SolutionDraft => ({
  title: "",
  language: "",
  approach: "",
  timeComplexity: "",
  spaceComplexity: "",
  code: "",
  thoughts: "",
});

export function solutionContent(solution: SolutionDraft): SolutionDraft {
  const {
    title,
    language,
    approach,
    timeComplexity,
    spaceComplexity,
    code,
    thoughts,
  } = solution;
  return {
    title,
    language,
    approach,
    timeComplexity,
    spaceComplexity,
    code,
    thoughts,
  };
}

function hasThoughtsContent(text: string): boolean {
  let inFence = false;
  for (const line of text.split(/\r\n?|\n/)) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    const content = inFence ? line.trim() : line.replace(/^\d+\. |[#*`_\s-]/g, "");
    if (content) return true;
  }
  return false;
}

const maxSolutionTextLength = 200_000;

function exceedsTextLimit(value: string): boolean {
  if (value.length <= maxSolutionTextLength) return false;
  // The API counts Unicode code points, while JavaScript string length counts UTF-16 units.
  let length = 0;
  for (const _character of value) {
    length += 1;
    if (length > maxSolutionTextLength) return true;
  }
  return false;
}

export function validateSolution(draft: SolutionDraft): string | null {
  if (exceedsTextLimit(draft.code))
    return "Solution code must be 200,000 characters or fewer.";
  if (exceedsTextLimit(draft.thoughts))
    return "Solution thoughts must be 200,000 characters or fewer.";
  return draft.code.trim() || hasThoughtsContent(draft.thoughts)
    ? null
    : "Add code or thoughts before saving this solution.";
}

export function saveSolutionEntry(
  entries: SavedSolution[],
  draft: SolutionDraft,
  problemId: number,
  id: string,
  now: string,
): SavedSolution[] {
  const error = validateSolution(draft);
  if (error) throw new Error(error);
  const existing = entries.find((entry) => entry.id === id);
  if (existing && existing.problemId !== problemId)
    throw new Error("This solution belongs to another problem.");
  const solution: SavedSolution = {
    ...solutionContent(draft),
    id,
    problemId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  return existing
    ? entries.map((entry) => (entry.id === id ? solution : entry))
    : [...entries, solution];
}

export const solutionsKey = "patterna.solutions.v1";
type BrowserStorage = Pick<Storage, "getItem" | "setItem">;

export function loadSolutions(storage: BrowserStorage): SavedSolution[] {
  const raw = storage.getItem(solutionsKey);
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Invalid saved solutions");
  const ids = new Set<string>();
  // Use the earlier content rule for solutions already saved in the browser.
  for (const entry of parsed) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      ![
        "id",
        "title",
        "language",
        "approach",
        "timeComplexity",
        "spaceComplexity",
        "code",
        "thoughts",
        "createdAt",
        "updatedAt",
      ].every((key) => typeof entry[key] === "string") ||
      !Number.isSafeInteger(entry.problemId) ||
      entry.problemId < 1 ||
      !entry.id ||
      ids.has(entry.id) ||
      !Number.isFinite(Date.parse(entry.createdAt)) ||
      !Number.isFinite(Date.parse(entry.updatedAt)) ||
      !(entry.code.trim() || entry.thoughts.replace(/[#*`_\s-]/g, ""))
    ) {
      throw new Error("Invalid saved solution");
    }
    ids.add(entry.id);
  }
  return parsed as SavedSolution[];
}

export function persistSolutions(
  storage: BrowserStorage,
  entries: SavedSolution[],
): void {
  storage.setItem(solutionsKey, JSON.stringify(entries));
}
