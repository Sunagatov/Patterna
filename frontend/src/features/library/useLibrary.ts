import { useEffect, useState } from "react";
import {
  addPractice,
  changeStatus,
  deletePractice,
  isValidPracticeDate,
  toggleReview,
} from "./library";
import { readProblems, saveProblems } from "./storage";
import type { Problem, TaskStatus } from "./types";

export function useLibrary() {
  const [problems, setProblems] = useState(readProblems);

  useEffect(() => {
    saveProblems(problems);
  }, [problems]);

  function update(id: number, change: (problem: Problem) => Problem) {
    setProblems((current) =>
      current.map((problem) => (problem.id === id ? change(problem) : problem)),
    );
  }

  return {
    problems,
    setStatus: (id: number, status: TaskStatus) =>
      update(id, (problem) => changeStatus(problem, status)),
    toggleReview: (id: number) => update(id, toggleReview),
    logPractice: (id: number, date: string) => {
      if (!isValidPracticeDate(date)) return;
      const entry = { id: crypto.randomUUID(), date };
      update(id, (problem) => addPractice(problem, entry));
    },
    deletePractice: (id: number, entryId: string) =>
      update(id, (problem) => deletePractice(problem, entryId)),
  };
}
