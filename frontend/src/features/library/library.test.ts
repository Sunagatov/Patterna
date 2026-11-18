import { describe, expect, it } from "vitest";
import { initialProblems } from "./data/fixtures";
import {
  addPractice,
  changeStatus,
  deletePractice,
  inList,
  isValidPracticeDate,
  matchesFilters,
  sortProblems,
  toggleReview,
} from "./library";
import { emptyFilters } from "./types";

const problem = initialProblems.find(
  (value) => value.lcSlug === "number-of-islands",
)!;

describe("library behaviour", () => {
  it("combines OR within difficulty with AND across topic and status", () => {
    const filters = {
      ...emptyFilters(),
      difficulties: ["Easy", "Medium"] as const,
      statuses: ["Unsolved"] as const,
      labels: ["Graphs"],
    };
    const mutableFilters = {
      ...filters,
      difficulties: [...filters.difficulties],
      statuses: [...filters.statuses],
    };
    expect(
      matchesFilters({ ...problem, status: "Unsolved" }, "", mutableFilters),
    ).toBe(true);
    expect(
      matchesFilters(
        { ...problem, difficulty: "Hard", status: "Unsolved" },
        "",
        mutableFilters,
      ),
    ).toBe(false);
    expect(
      matchesFilters({ ...problem, status: "Solved" }, "", mutableFilters),
    ).toBe(false);
    expect(
      matchesFilters(
        { ...problem, status: "Unsolved", tags: ["Trees"] },
        "",
        mutableFilters,
      ),
    ).toBe(false);
  });

  it("distinguishes matching any label from matching all labels", () => {
    const filters = { ...emptyFilters(), labels: ["Graphs", "BFS"] };
    expect(matchesFilters({ ...problem, tags: ["Graphs"] }, "", filters)).toBe(
      true,
    );
    expect(
      matchesFilters({ ...problem, tags: ["Graphs"] }, "", {
        ...filters,
        labelMatch: "all",
      }),
    ).toBe(false);
    expect(
      matchesFilters({ ...problem, tags: ["Graphs", "BFS"] }, "", {
        ...filters,
        labelMatch: "all",
      }),
    ).toBe(true);
  });

  it("keeps status, review and practice independent and never mutates the source", () => {
    const original = {
      ...problem,
      status: "Unsolved" as const,
      needsReview: false,
      history: [],
    };
    const solved = changeStatus(original, "Solved");
    expect(solved).toMatchObject({
      status: "Solved",
      needsReview: false,
      history: [],
    });
    const reviewed = toggleReview(solved);
    expect(reviewed.status).toBe("Solved");
    expect(reviewed.history).toHaveLength(0);
    const practised = addPractice(reviewed, {
      id: "new-entry",
      date: "2026-11-15",
    });
    expect(practised).toMatchObject({ status: "Solved", needsReview: true });
    expect(practised.history).toHaveLength(1);
    expect(deletePractice(practised, "new-entry").history).toHaveLength(0);
    expect(original).toEqual({
      ...problem,
      status: "Unsolved",
      needsReview: false,
      history: [],
    });
  });

  it("sorts without changing input order and keeps never-practised tasks last for date sorts", () => {
    const a = { ...problem, id: 1, title: "Zebra", history: [] };
    const b = {
      ...problem,
      id: 2,
      title: "Apple",
      history: [{ id: "b", date: "2026-11-10" }],
    };
    const c = {
      ...problem,
      id: 3,
      title: "Pear",
      history: [{ id: "c", date: "2026-11-15" }],
    };
    const source = [a, b, c];
    expect(sortProblems(source, "title").map((value) => value.id)).toEqual([
      2, 3, 1,
    ]);
    expect(sortProblems(source, "recent").map((value) => value.id)).toEqual([
      3, 2, 1,
    ]);
    expect(sortProblems(source, "oldest").map((value) => value.id)).toEqual([
      2, 3, 1,
    ]);
    expect(source).toEqual([a, b, c]);
  });

  it("accepts backdating and rejects future dates and invalid calendar dates", () => {
    expect(isValidPracticeDate("2026-11-15", "2026-11-16")).toBe(true);
    expect(isValidPracticeDate("2026-11-17", "2026-11-16")).toBe(false);
    expect(isValidPracticeDate("2026-02-30", "2026-11-16")).toBe(false);
    expect(isValidPracticeDate("0000-01-01", "2026-11-16")).toBe(false);
    expect(isValidPracticeDate("not-a-date", "2026-11-16")).toBe(false);
  });

  it("shares canonical problem identities across overlapping study lists", () => {
    expect(initialProblems).toHaveLength(250);
    expect(new Set(initialProblems.map((value) => value.id)).size).toBe(250);
    expect(
      initialProblems.filter((value) => inList(value, "nc150")),
    ).toHaveLength(150);
    expect(
      initialProblems.filter((value) => inList(value, "blind75")),
    ).toHaveLength(75);
    const twoSum = initialProblems.find((value) => value.lcSlug === "two-sum")!;
    expect(
      inList(twoSum, "nc250") &&
        inList(twoSum, "nc150") &&
        inList(twoSum, "blind75"),
    ).toBe(true);
  });
});
