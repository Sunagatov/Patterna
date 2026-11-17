import { useEffect, useRef, useState } from "react";
import { Icon } from "../../shared/ui/Icon";
import { CodeEditor } from "./CodeEditor";
import { ThoughtsEditor } from "./ThoughtsEditor";
import { emptySolution, solutionContent } from "./solutions";
import type { SavedSolution, SolutionDraft } from "./solutions";
import type { SolutionsController } from "./useSolutions";

interface Props {
  problemId: number;
  solutions: SolutionsController;
  onDirtyChange: (dirty: boolean) => void;
}

export function SolutionWorkspace({
  problemId,
  solutions,
  onDirtyChange,
}: Props) {
  const entries = solutions.entries.filter(
    (entry) => entry.problemId === problemId,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    entries[0]?.id ?? null,
  );
  const [draft, setDraft] = useState<SolutionDraft>(() =>
    entries[0] ? solutionContent(entries[0]) : emptySolution(),
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const newId = useRef<string | null>(null);
  const selected = entries.find((entry) => entry.id === selectedId);
  const dirty =
    JSON.stringify(draft) !==
    JSON.stringify(selected ? solutionContent(selected) : emptySolution());

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  function update(change: Partial<SolutionDraft>) {
    setDraft((current) => ({ ...current, ...change }));
    setMessage("");
    setError("");
  }
  function open(entry?: SavedSolution) {
    if (busy) return;
    if (dirty && !window.confirm("Discard your unsaved solution changes?"))
      return;
    setSelectedId(entry?.id ?? null);
    newId.current = null;
    setDraft(entry ? solutionContent(entry) : emptySolution());
    setMessage("");
    setError("");
  }
  async function save() {
    if (busy) return;
    const id = selectedId ?? (newId.current ??= crypto.randomUUID());
    setBusy(true);
    const failure = await solutions.save(problemId, id, draft);
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    setSelectedId(id);
    setError("");
    setMessage("Solution saved.");
  }
  async function remove() {
    if (
      busy ||
      !selected ||
      !window.confirm(
        `Delete “${selected.title.trim() || "this solution"}”? This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    const failure = await solutions.remove(selected.id);
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    const next = entries.find((entry) => entry.id !== selected.id);
    setSelectedId(next?.id ?? null);
    newId.current = null;
    setDraft(next ? solutionContent(next) : emptySolution());
    setError("");
    setMessage("Solution deleted.");
    onDirtyChange(false);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(draft.code);
      setMessage("Code copied.");
    } catch {
      setError(
        "Could not access the clipboard. Select and copy the code manually.",
      );
    }
  }

  return (
    <section
      className="solution-workspace"
      aria-label="Your solutions"
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "s"
        ) {
          event.preventDefault();
          save();
        }
      }}
    >
      <div className="pane-heading solution-heading">
        <Icon name="code" />
        <strong>Your solutions</strong>
        <span className="pane-count">{entries.length}</span>
        <span className="pane-heading-spacer" />
        <button
          className="workspace-text-button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          aria-expanded={detailsOpen}
        >
          Details
          <Icon name="chevronDown" />
        </button>
      </div>
      <div className="solution-toolbar">
        <label>
          <span className="sr-only">Programming language</span>
          <select
            aria-label="Programming language"
            value={draft.language}
            onChange={(event) => update({ language: event.target.value })}
          >
            {[
              "Plain text",
              "Java",
              "Kotlin",
              "Python",
              "JavaScript",
              "TypeScript",
              "C++",
              "C",
              "C#",
              "Go",
              "Rust",
              "Swift",
              "Ruby",
              "SQL",
            ].map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
        </label>
        <span className="draft-state">
          {dirty ? "Unsaved changes" : selected ? "Saved" : "New solution"}
        </span>
        <span className="pane-heading-spacer" />
        <button
          className="icon-button"
          onClick={() => void copy()}
          aria-label="Copy solution code"
          disabled={!draft.code}
        >
          <Icon name="copy" />
        </button>
        <button
          className="icon-button"
          onClick={remove}
          aria-label="Delete selected solution"
          disabled={!selected || busy}
        >
          <Icon name="trash" />
        </button>
      </div>
      <div className="solution-tabs" aria-label="Saved solution tabs">
        {entries.map((entry, index) => (
          <button
            key={entry.id}
            aria-pressed={selectedId === entry.id}
            onClick={() => open(entry)}
            title={entry.title || `Solution ${index + 1}`}
          >
            {entry.title.trim() || `Solution ${index + 1}`}
            {selectedId === entry.id && dirty ? (
              <span className="unsaved-dot" aria-label="Unsaved changes" />
            ) : null}
          </button>
        ))}
        {selectedId === null ? (
          <button aria-pressed="true" className="new-solution-tab">
            New solution{dirty ? <span className="unsaved-dot" /> : null}
          </button>
        ) : null}
        <button
          className="add-solution-tab"
          onClick={() => open()}
          aria-label="Add solution"
          title="Add a separate solution"
        >
          <Icon name="plus" />
        </button>
      </div>
      {detailsOpen ? (
        <div className="solution-metadata">
          <label>
            Title
            <input
              value={draft.title}
              maxLength={120}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="e.g. Iterative approach"
            />
          </label>
          <label>
            Approach labels
            <input
              value={draft.approach}
              maxLength={200}
              onChange={(event) => update({ approach: event.target.value })}
              placeholder="e.g. DFS, recursion"
            />
          </label>
          <label>
            Time complexity
            <input
              value={draft.timeComplexity}
              maxLength={80}
              onChange={(event) =>
                update({ timeComplexity: event.target.value })
              }
              placeholder="e.g. O(n)"
            />
          </label>
          <label>
            Space complexity
            <input
              value={draft.spaceComplexity}
              maxLength={80}
              onChange={(event) =>
                update({ spaceComplexity: event.target.value })
              }
              placeholder="e.g. O(1)"
            />
          </label>
          {selected ? (
            <p>
              Created{" "}
              {new Date(selected.createdAt).toLocaleDateString("en-GB", {
                timeZone: "Europe/London",
              })}{" "}
              · Last saved{" "}
              {new Date(selected.updatedAt).toLocaleDateString("en-GB", {
                timeZone: "Europe/London",
              })}
            </p>
          ) : null}
        </div>
      ) : null}
      <CodeEditor code={draft.code} onChange={(code) => update({ code })} />
      <ThoughtsEditor
        text={draft.thoughts}
        onChange={(thoughts) => update({ thoughts })}
      />
      <div className="solution-savebar">
        <div className="save-status">
          <span
            className={error ? "field-error" : "detail-muted"}
            role={error ? "alert" : "status"}
          >
            {error || message}
          </span>
        </div>
        <button
          className="button button-primary"
          onClick={save}
          disabled={busy}
        >
          {busy ? "Saving…" : "Save solution"}
        </button>
      </div>
    </section>
  );
}
