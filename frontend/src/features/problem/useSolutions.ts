import { useState } from "react";
import { api, errorMessage } from "../../api/client";
import type { ApiSolution } from "../../api/client";
import type { SolutionDraft } from "./solutions";

export function useSolutions(initial: ApiSolution[]) {
  const [entries, setEntries] = useState(initial);

  return {
    entries,
    replaceEntries: setEntries,
    save: async (problemId: number, id: string, draft: SolutionDraft) => {
      const existing = entries.find((entry) => entry.id === id);
      try {
        const { data } = await api.PUT(
          "/api/problems/{problem_id}/solutions/{solution_id}",
          {
            params: { path: { problem_id: problemId, solution_id: id } },
            body: { ...draft, version: existing?.version ?? 0 },
          },
        );
        if (!data) throw new Error("Missing saved solution");
        setEntries((current) =>
          current.some((entry) => entry.id === id)
            ? current.map((entry) => (entry.id === id ? data : entry))
            : [...current, data],
        );
        return null;
      } catch (error) {
        return errorMessage(error);
      }
    },
    remove: async (id: string) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) return null;
      try {
        await api.DELETE("/api/problems/{problem_id}/solutions/{solution_id}", {
          params: {
            path: { problem_id: entry.problemId, solution_id: id },
            query: { version: entry.version },
          },
        });
        setEntries((current) => current.filter((item) => item.id !== id));
        return null;
      } catch (error) {
        return errorMessage(error);
      }
    },
  };
}

export type SolutionsController = ReturnType<typeof useSolutions>;
