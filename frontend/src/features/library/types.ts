import type { components } from "../../api/schema";

export const taskStatuses = [
  "Not started",
  "In progress",
  "Unsolved",
  "Solved",
] as const;
export type TaskStatus = (typeof taskStatuses)[number];
export type Difficulty = "Easy" | "Medium" | "Hard" | "Very Hard";
export type StudyListId = components["schemas"]["ProblemView"]["lists"][number];
export type LibraryListId = StudyListId | "all";
export type Platform = "LeetCode" | "NeetCode" | "AlgoExpert";

export interface PracticeEntry {
  id: string;
  date: string;
}

export interface Problem {
  id: number;
  title: string;
  difficulty: Difficulty;
  category: string;
  lcSlug: string;
  ncSlug: string;
  lists: StudyListId[];
  tags: string[];
  status: TaskStatus;
  needsReview: boolean;
  history: PracticeEntry[];
}

export interface LibraryFilters {
  difficulties: Difficulty[];
  statuses: TaskStatus[];
  labels: string[];
  platforms: Platform[];
  needsReview: boolean;
  labelMatch: "any" | "all";
}

export type SortOrder =
  | "list"
  | "difficulty"
  | "difficulty-desc"
  | "title"
  | "title-desc"
  | "practice"
  | "practice-desc"
  | "recent"
  | "oldest";

export const studyLists: { id: LibraryListId; name: string }[] = [
  { id: "nc250", name: "NeetCode 250" },
  { id: "nc150", name: "NeetCode 150" },
  { id: "blind75", name: "Blind 75" },
  { id: "leetcode75", name: "LeetCode 75" },
  { id: "top100liked", name: "Top 100 Liked" },
  { id: "topinterview150", name: "Top Interview 150" },
  { id: "all", name: "All problems" },
];

export function emptyFilters(): LibraryFilters {
  return {
    difficulties: [],
    statuses: [],
    labels: [],
    platforms: [],
    needsReview: false,
    labelMatch: "any",
  };
}
