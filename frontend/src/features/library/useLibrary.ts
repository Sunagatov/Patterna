import { useRef, useState } from "react";
import { api, ApiError, errorMessage } from "../../api/client";
import { addPractice, deletePractice } from "./library";
import type { Problem, TaskStatus } from "./types";

export function useLibrary(initial: Problem[]) {
  const [problems, setProblems] = useState(initial);
  const practiceRetries = useRef(new Map<string, string>());

  function update(id: number, change: (problem: Problem) => Problem) {
    setProblems((current) =>
      current.map((problem) => (problem.id === id ? change(problem) : problem)),
    );
  }

  async function perform(operation: () => Promise<void>) {
    try {
      await operation();
      return null;
    } catch (error) {
      return errorMessage(error);
    }
  }

  return {
    problems,
    replaceProblems: setProblems,
    setStatus: (id: number, status: TaskStatus) =>
      perform(async () => {
        const { data } = await api.PATCH(
          "/api/problems/{problem_id}/progress",
          {
            params: { path: { problem_id: id } },
            body: { status },
          },
        );
        if (data)
          update(id, (problem) => ({ ...problem, status: data.status }));
      }),
    toggleReview: (id: number) =>
      perform(async () => {
        const problem = problems.find((item) => item.id === id);
        if (!problem) return;
        const { data } = await api.PATCH(
          "/api/problems/{problem_id}/progress",
          {
            params: { path: { problem_id: id } },
            body: { needsReview: !problem.needsReview },
          },
        );
        if (data)
          update(id, (item) => ({ ...item, needsReview: data.needsReview }));
      }),
    logPractice: (id: number, date: string) =>
      perform(async () => {
        const key = `${id}:${date}`;
        const practiceId =
          practiceRetries.current.get(key) ?? crypto.randomUUID();
        practiceRetries.current.set(key, practiceId);
        try {
          const { data } = await api.PUT(
            "/api/problems/{problem_id}/practices/{practice_id}",
            {
              params: { path: { problem_id: id, practice_id: practiceId } },
              body: { id: practiceId, date },
            },
          );
          practiceRetries.current.delete(key);
          if (data)
            update(id, (problem) =>
              problem.history.some((entry) => entry.id === data.id)
                ? problem
                : addPractice(problem, data),
            );
        } catch (error) {
          if (error instanceof ApiError && error.status < 500)
            practiceRetries.current.delete(key);
          throw error;
        }
      }),
    deletePractice: (id: number, entryId: string) =>
      perform(async () => {
        await api.DELETE("/api/problems/{problem_id}/practices/{practice_id}", {
          params: { path: { problem_id: id, practice_id: entryId } },
        });
        update(id, (problem) => deletePractice(problem, entryId));
      }),
  };
}

export type LibraryController = ReturnType<typeof useLibrary>;
