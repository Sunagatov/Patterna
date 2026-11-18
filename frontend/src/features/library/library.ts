import type {
  Difficulty,
  LibraryFilters,
  LibraryListId,
  PracticeEntry,
  Problem,
  SortOrder,
  TaskStatus,
} from "./types";

export function inList(problem: Problem, listId: LibraryListId): boolean {
  return listId === "all" || problem.lists.includes(listId);
}

export function matchesFilters(
  problem: Problem,
  search: string,
  filters: LibraryFilters,
): boolean {
  const query = search.trim().toLocaleLowerCase();
  if (
    query &&
    !`${problem.title} ${problem.category} ${problem.tags.join(" ")} ${problem.id}`
      .toLocaleLowerCase()
      .includes(query)
  )
    return false;
  if (
    filters.difficulties.length &&
    !filters.difficulties.includes(problem.difficulty)
  )
    return false;
  if (filters.statuses.length && !filters.statuses.includes(problem.status))
    return false;
  if (filters.needsReview && !problem.needsReview) return false;
  if (filters.labels.length) {
    const match = (label: string) => problem.tags.includes(label);
    if (
      !(filters.labelMatch === "all"
        ? filters.labels.every(match)
        : filters.labels.some(match))
    )
      return false;
  }
  const platforms = [
    problem.lcSlug ? "LeetCode" : null,
    problem.ncSlug ? "NeetCode" : null,
  ];
  return (
    !filters.platforms.length ||
    filters.platforms.some((platform) => platforms.includes(platform))
  );
}

export function filterCount(filters: LibraryFilters): number {
  return (
    filters.difficulties.length +
    filters.statuses.length +
    filters.labels.length +
    filters.platforms.length +
    Number(filters.needsReview)
  );
}

export function lastPractised(problem: Problem): string {
  return problem.history.reduce(
    (latest, entry) => (entry.date > latest ? entry.date : latest),
    "",
  );
}

export function sortProblems(problems: Problem[], sort: SortOrder): Problem[] {
  const rank: Record<Difficulty, number> = {
    Easy: 0,
    Medium: 1,
    Hard: 2,
    "Very Hard": 3,
  };
  return [...problems].sort((a, b) => {
    switch (sort) {
      case "difficulty":
        return rank[a.difficulty] - rank[b.difficulty] || a.id - b.id;
      case "difficulty-desc":
        return rank[b.difficulty] - rank[a.difficulty] || a.id - b.id;
      case "title":
        return a.title.localeCompare(b.title);
      case "title-desc":
        return b.title.localeCompare(a.title);
      case "practice":
        return a.history.length - b.history.length || a.id - b.id;
      case "practice-desc":
        return b.history.length - a.history.length || a.id - b.id;
      case "recent":
        return lastPractised(b).localeCompare(lastPractised(a)) || a.id - b.id;
      case "oldest":
        return (
          (lastPractised(a) || "9999").localeCompare(
            lastPractised(b) || "9999",
          ) || a.id - b.id
        );
      default:
        return a.id - b.id;
    }
  });
}

export function changeStatus(problem: Problem, status: TaskStatus): Problem {
  return { ...problem, status };
}

export function toggleReview(problem: Problem): Problem {
  return { ...problem, needsReview: !problem.needsReview };
}

export function addPractice(problem: Problem, entry: PracticeEntry): Problem {
  return { ...problem, history: [...problem.history, entry] };
}

export function deletePractice(problem: Problem, entryId: string): Problem {
  return {
    ...problem,
    history: problem.history.filter((entry) => entry.id !== entryId),
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/London",
});
const fullDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});

export function formatDate(date: string, full = false): string {
  return (full ? fullDateFormatter : dateFormatter).format(
    new Date(`${date}T12:00:00Z`),
  );
}

export function today(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isValidPracticeDate(
  date: string,
  latestDate = today(),
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    date.startsWith("0000-") ||
    date > latestDate
  )
    return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}
