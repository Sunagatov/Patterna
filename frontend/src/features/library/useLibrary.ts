import { useRef, useState } from "react";
import { api, ApiError, errorMessage } from "../../api/client";
import { addPractice, deletePractice } from "./library";
import type { Problem, TaskStatus } from "./types";

type ProgressChange = { status: TaskStatus } | { needsReview: boolean };
type ProgressField = "status" | "needsReview";

export function useLibrary(initial: Problem[]) {
  const [problems, setProblems] = useState(initial);
  const practiceRetries = useRef(new Map<string, string>());
  const requests = useRef(new Set<string>());
  const [pendingChanges, setPendingChanges] = useState(
    () => new Set<string>(),
  );

  function update(id: number, change: (problem: Problem) => Problem) {
    setProblems((current) =>
      current.map((problem) => (problem.id === id ? change(problem) : problem)),
    );
  }

  async function perform(key: string, operation: () => Promise<void>) {
    const pending = requests.current;
    if (pending.has(key)) return null;
    pending.add(key);
    setPendingChanges(new Set(pending));
    try {
      await operation();
      return null;
    } catch (error) {
      return errorMessage(error);
    } finally {
      pending.delete(key);
      setPendingChanges(new Set(pending));
    }
  }

  async function saveProgress(id: number, change: ProgressChange) {
    const field = "status" in change ? "status" : "needsReview";
    return perform(`${id}:${field}`, async () => {
      const { data } = await api.PATCH("/api/problems/{problem_id}/progress", {
        params: { path: { problem_id: id } },
        body: change,
      });
      if (data)
        update(id, (problem) => ({ ...problem, [field]: data[field] }));
    });
  }

  return {
    problems,
    replaceProblems: setProblems,
    isProgressPending: (id: number, field: ProgressField) =>
      pendingChanges.has(`${id}:${field}`),
    isPracticePending: (id: number) => pendingChanges.has(`${id}:practice`),
    setStatus: (id: number, status: TaskStatus) => saveProgress(id, { status }),
    toggleReview: async (id: number) => {
      const problem = problems.find((item) => item.id === id);
      return problem
        ? saveProgress(id, { needsReview: !problem.needsReview })
        : null;
    },
    logPractice: (id: number, date: string) =>
      perform(`${id}:practice`, async () => {
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
      perform(`${id}:practice`, async () => {
        await api.DELETE("/api/problems/{problem_id}/practices/{practice_id}", {
          params: { path: { problem_id: id, practice_id: entryId } },
        });
        update(id, (problem) => deletePractice(problem, entryId));
      }),
  };
}

export type LibraryController = ReturnType<typeof useLibrary>;
