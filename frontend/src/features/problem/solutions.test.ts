import { describe, expect, it } from "vitest";
import {
  emptySolution,
  loadSolutions,
  persistSolutions,
  saveSolutionEntry,
  solutionContent,
  solutionsKey,
  validateSolution,
} from "./solutions";

const firstDate = "2026-11-16T12:00:00.000Z";
const laterDate = "2026-11-16T13:00:00.000Z";
const draft = {
  ...emptySolution(),
  title: "DFS",
  code: "// DFS\nreturn answer;",
  thoughts: "**Remember** the visited set.",
};

function memoryStorage(raw: string | null = null) {
  let value = raw;
  return {
    getItem: (_key: string) => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
}

describe("personal solutions", () => {
  it("allows code-only and thoughts-only entries but rejects empty formatting", () => {
    expect(
      validateSolution({ ...emptySolution(), code: "return 1;" }),
    ).toBeNull();
    expect(
      validateSolution({
        ...emptySolution(),
        thoughts: "## Approach\n- Use two pointers",
      }),
    ).toBeNull();
    expect(
      validateSolution({ ...emptySolution(), thoughts: "** **\n- " }),
    ).toBeTruthy();
    expect(() =>
      saveSolutionEntry([], emptySolution(), 1, "one", firstDate),
    ).toThrow();
  });

  it("retains multiple independent approaches and their own thoughts", () => {
    const first = saveSolutionEntry([], draft, 1, "dfs", firstDate);
    const secondDraft = {
      ...draft,
      title: "BFS",
      code: "// Queue",
      thoughts: "Track each level.",
    };
    const second = saveSolutionEntry(first, secondDraft, 1, "bfs", laterDate);
    expect(second).toHaveLength(2);
    expect(second[0]).toEqual(first[0]);
    expect(second[1].thoughts).toBe("Track each level.");
    expect(first).toHaveLength(1);
  });

  it("reports the oversized field and counts Unicode code points like the API", () => {
    const limit = "x".repeat(199_999) + "🧩";
    expect(validateSolution({ ...emptySolution(), code: limit })).toBeNull();
    expect(validateSolution({ ...emptySolution(), code: limit + "x" })).toBe(
      "Solution code must be 200,000 characters or fewer.",
    );
    expect(validateSolution({ ...emptySolution(), thoughts: limit + "x" })).toBe(
      "Solution thoughts must be 200,000 characters or fewer.",
    );
  });

  it("requires content inside numbered items and fences on new saves", () => {
    for (const thoughts of ["1. \n2. ", "```python\n```", "```text\r\n  \r\n```"])
      expect(validateSolution({ ...emptySolution(), thoughts })).toBeTruthy();
    for (const thoughts of ["7. First step", "1.", "```\n---\n```"])
      expect(validateSolution({ ...emptySolution(), thoughts })).toBeNull();
  });

  it("reads older browser saves that contain a Markdown placeholder", () => {
    const [entry] = saveSolutionEntry([], draft, 1, "old", firstDate);
    const legacy = { ...entry, code: "", thoughts: "1. " };
    expect(loadSolutions(memoryStorage(JSON.stringify([legacy])))).toEqual([legacy]);
  });

  it("edits only the selected solution while preserving its creation date", () => {
    const first = saveSolutionEntry([], draft, 1, "dfs", firstDate);
    const two = saveSolutionEntry(
      first,
      { ...draft, title: "BFS" },
      2,
      "other-task",
      firstDate,
    );
    const edited = saveSolutionEntry(
      two,
      { ...draft, code: "// revised" },
      1,
      "dfs",
      laterDate,
    );
    expect(edited).toHaveLength(2);
    expect(edited[0]).toMatchObject({
      code: "// revised",
      createdAt: firstDate,
      updatedAt: laterDate,
    });
    expect(edited[1]).toEqual(two[1]);
    expect(() => saveSolutionEntry(two, draft, 2, "dfs", laterDate)).toThrow(
      "another problem",
    );
  });

  it("round-trips code, formatting and metadata without changing other storage keys", () => {
    const entries = saveSolutionEntry(
      [],
      {
        ...draft,
        language: "Kotlin",
        code: 'val x = "🧩 <script>"\n\tprintln(x)',
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      1,
      "one",
      firstDate,
    );
    const storage = new Map<string, string>([
      ["patterna.library.v1", "existing progress"],
    ]);
    const adapter = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    };
    persistSolutions(adapter, entries);
    expect(loadSolutions(adapter)).toEqual(entries);
    expect(storage.get("patterna.library.v1")).toBe("existing progress");
    expect(solutionContent(entries[0])).not.toHaveProperty("id");
  });

  it("does not silently erase corrupt, duplicate or invalid solution data", () => {
    expect(loadSolutions(memoryStorage())).toEqual([]);
    const entries = saveSolutionEntry([], draft, 1, "one", firstDate);
    for (const raw of [
      "broken json",
      "{}",
      JSON.stringify([...entries, ...entries]),
      JSON.stringify([{ ...entries[0], createdAt: "invalid" }]),
      JSON.stringify([{ ...entries[0], thoughts: 42 }]),
    ]) {
      const storage = memoryStorage(raw);
      expect(() => loadSolutions(storage)).toThrow();
      expect(storage.getItem(solutionsKey)).toBe(raw);
    }
  });

  it("surfaces storage failures to the caller instead of reporting a successful save", () => {
    expect(() =>
      persistSolutions(
        {
          getItem: () => null,
          setItem: () => {
            throw new Error("quota exceeded");
          },
        },
        [],
      ),
    ).toThrow("quota exceeded");
  });
});
