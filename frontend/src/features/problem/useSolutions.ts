import { useState } from "react";
import {
  loadSolutions,
  persistSolutions,
  saveSolutionEntry,
} from "./solutions";
import type { SavedSolution, SolutionDraft } from "./solutions";

export function useSolutions() {
  const [state, setState] = useState(() => {
    try {
      return {
        entries: loadSolutions(localStorage),
        error: null as string | null,
      };
    } catch {
      return {
        entries: [] as SavedSolution[],
        error:
          "Saved solutions could not be read. Existing browser data has been left untouched. Saving is disabled to protect it.",
      };
    }
  });

  function commit(entries: SavedSolution[]): string | null {
    if (state.error) return state.error;
    try {
      if (
        JSON.stringify(loadSolutions(localStorage)) !==
        JSON.stringify(state.entries)
      ) {
        return "Saved solutions changed in another tab. Copy your draft, then reload before saving so no work is overwritten.";
      }
      persistSolutions(localStorage, entries);
      setState({ entries, error: null });
      return null;
    } catch {
      return "Could not save in this browser. Your draft is still here. Check available storage or copy your work before leaving.";
    }
  }

  return {
    entries: state.entries,
    error: state.error,
    save: (problemId: number, id: string, draft: SolutionDraft) => {
      try {
        return commit(
          saveSolutionEntry(
            state.entries,
            draft,
            problemId,
            id,
            new Date().toISOString(),
          ),
        );
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "Could not save solution.";
      }
    },
    remove: (id: string) =>
      commit(state.entries.filter((entry) => entry.id !== id)),
  };
}

export type SolutionsController = ReturnType<typeof useSolutions>;
