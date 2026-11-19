import { useEffect, useRef, useState } from "react";
import { Icon } from "../../shared/ui/Icon";
import { CodeEditor, codeLanguages } from "./CodeEditor";
import type { FormatRequest, FormatResult } from "./formatCode.worker";
import { ThoughtsEditor } from "./ThoughtsEditor";
import { emptySolution, solutionContent, validateSolution } from "./solutions";
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
  const [notice, setNotice] = useState<
    "saved" | "deleted" | "copied" | "formatted" | "already-formatted" | null
  >(null);
  const [error, setError] = useState("");
  const [formatting, setFormatting] = useState(false);
  const [operation, setOperation] = useState<"save" | "delete" | null>(null);
  const busy = operation !== null;
  const deleting = operation === "delete";
  const newId = useRef<string | null>(null);
  const formatWorker = useRef<Worker | null>(null);
  const formatLanguage = codeLanguages.get(draft.language);
  const selected = entries.find((entry) => entry.id === selectedId);
  const dirty =
    JSON.stringify(draft) !==
    JSON.stringify(selected ? solutionContent(selected) : emptySolution());
  const canSave = !busy && !formatting && (!selected || dirty);
  const feedback =
    notice &&
    {
      saved: dirty
        ? "Earlier edits saved. New edits are unsaved."
        : "Solution saved.",
      deleted: "Solution deleted.",
      copied: "Code copied.",
      formatted: "Code formatted. Save solution to keep the changes.",
      "already-formatted": "Code is already formatted.",
    }[notice];

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => formatWorker.current?.terminate(), []);

  function stopFormatting() {
    if (!formatWorker.current) return;
    formatWorker.current.terminate();
    formatWorker.current = null;
    setFormatting(false);
  }

  function update(change: Partial<SolutionDraft>) {
    if (change.code !== undefined || change.language !== undefined)
      stopFormatting();
    setDraft((current) => ({ ...current, ...change }));
    setNotice(null);
    setError("");
  }
  function open(entry?: SavedSolution) {
    if (busy) return;
    if (dirty && !window.confirm("Discard your unsaved solution changes?"))
      return;
    stopFormatting();
    setSelectedId(entry?.id ?? null);
    newId.current = null;
    setDraft(entry ? solutionContent(entry) : emptySolution());
    setNotice(null);
    setError("");
  }
  async function save() {
    if (!canSave) return;
    const validationError = validateSolution(draft);
    if (validationError) {
      setNotice(null);
      setError(validationError);
      return;
    }
    const id = selectedId ?? (newId.current ??= crypto.randomUUID());
    setNotice(null);
    setError("");
    setOperation("save");
    const failure = await solutions.save(problemId, id, draft);
    setOperation(null);
    if (failure) {
      setError(failure);
      return;
    }
    setSelectedId(id);
    setError("");
    setNotice("saved");
  }
  async function remove() {
    if (
      busy ||
      formatting ||
      !selected ||
      !window.confirm(
        `Delete “${selected.title.trim() || "this solution"}”? This cannot be undone.${
          dirty ? " Unsaved edits to this solution will also be discarded." : ""
        }`,
      )
    )
      return;
    setNotice(null);
    setError("");
    setOperation("delete");
    const failure = await solutions.remove(selected.id);
    setOperation(null);
    if (failure) {
      setError(failure);
      return;
    }
    const next = entries.find((entry) => entry.id !== selected.id);
    setSelectedId(next?.id ?? null);
    newId.current = null;
    setDraft(next ? solutionContent(next) : emptySolution());
    setError("");
    setNotice("deleted");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(draft.code);
      setNotice("copied");
    } catch {
      setError(
        "Could not access the clipboard. Select and copy the code manually.",
      );
    }
  }

  function formatDraft() {
    if (!formatLanguage || !draft.code.trim() || busy || formatWorker.current)
      return;

    const request: FormatRequest = {
      code: draft.code,
      language: formatLanguage,
    };
    const fail = () =>
      setError(
        `Could not format ${draft.language} code. Check its syntax and try again.`,
      );
    setNotice(null);
    setError("");

    let worker: Worker;
    try {
      worker = new Worker(new URL("./formatCode.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      fail();
      return;
    }
    formatWorker.current = worker;
    setFormatting(true);
    worker.onmessage = ({ data }: MessageEvent<FormatResult>) => {
      if (formatWorker.current !== worker) return;
      stopFormatting();
      if ("error" in data) {
        fail();
      } else if (data.code === request.code) {
        setNotice("already-formatted");
      } else {
        update({ code: data.code });
        setNotice("formatted");
      }
    };
    worker.onerror = () => {
      if (formatWorker.current !== worker) return;
      stopFormatting();
      fail();
    };
    worker.postMessage(request);
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
            disabled={deleting}
            onChange={(event) => update({ language: event.target.value })}
          >
            <option value="">No language</option>
            {draft.language && !codeLanguages.has(draft.language) ? (
              <option value={draft.language}>{draft.language}</option>
            ) : null}
            {Array.from(codeLanguages.keys(), (language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
        </label>
        <span className="draft-state">
          {dirty ? "Unsaved changes" : selected ? "Saved" : "New solution"}
        </span>
        <span className="pane-heading-spacer" />
        <button
          type="button"
          className="workspace-text-button format-code-button"
          title={
            formatLanguage
              ? undefined
              : "Select a programming language to format code"
          }
          onClick={formatDraft}
          disabled={!formatLanguage || !draft.code.trim() || busy || formatting}
        >
          {formatting ? "Formatting…" : "Format code"}
        </button>
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
          disabled={!selected || busy || formatting}
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
            disabled={busy}
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
          disabled={busy}
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
              readOnly={deleting}
              maxLength={120}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="e.g. Iterative approach"
            />
          </label>
          <label>
            Approach labels
            <input
              value={draft.approach}
              readOnly={deleting}
              maxLength={200}
              onChange={(event) => update({ approach: event.target.value })}
              placeholder="e.g. DFS, recursion"
            />
          </label>
          <label>
            Time complexity
            <input
              value={draft.timeComplexity}
              readOnly={deleting}
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
              readOnly={deleting}
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
      <CodeEditor
        code={draft.code}
        language={draft.language}
        readOnly={deleting}
        onChange={(code) => update({ code })}
      />
      <ThoughtsEditor
        text={draft.thoughts}
        readOnly={deleting}
        onChange={(thoughts) => update({ thoughts })}
      />
      <div className="solution-savebar">
        <div className="save-status">
          <span
            className={error ? "field-error" : "detail-muted"}
            role={error ? "alert" : "status"}
          >
            {error || feedback}
          </span>
        </div>
        <button
          className="button button-primary"
          onClick={save}
          disabled={!canSave}
        >
          {deleting ? "Deleting…" : busy ? "Saving…" : "Save solution"}
        </button>
      </div>
    </section>
  );
}
