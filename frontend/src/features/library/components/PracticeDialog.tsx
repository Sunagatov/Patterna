import { useId, useState } from "react";
import { Dialog } from "../../../shared/ui/Dialog";
import { Icon } from "../../../shared/ui/Icon";
import { formatDate, isValidPracticeDate, today } from "../library";
import type { Problem } from "../types";

interface Props {
  problem: Problem;
  busy: boolean;
  onLog: (id: number, date: string) => Promise<string | null>;
  onDelete: (id: number, entryId: string) => Promise<string | null>;
  onClose: () => void;
}

export function PracticeDialog({
  problem,
  busy,
  onLog,
  onDelete,
  onClose,
}: Props) {
  return (
    <Dialog
      title="Practice history"
      subtitle={problem.title}
      className="practice-dialog"
      onClose={onClose}
    >
      <PracticeContent
        problem={problem}
        busy={busy}
        onLog={onLog}
        onDelete={onDelete}
      />
    </Dialog>
  );
}

export function PracticeContent({
  problem,
  busy,
  onLog,
  onDelete,
}: Omit<Props, "onClose">) {
  const [error, setError] = useState("");
  const dateId = useId();
  return (
    <div className="practice-body">
      <div className="practice-total" aria-live="polite">
        <Icon name="repeat" />
        <span>
          Practised <strong>{problem.history.length}</strong>{" "}
          {problem.history.length === 1 ? "time" : "times"}
        </span>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const date = String(
            new FormData(event.currentTarget).get("date") ?? "",
          );
          if (!isValidPracticeDate(date)) {
            setError("Choose a valid date, no later than today.");
            return;
          }
          setError("");
          setError((await onLog(problem.id, date)) ?? "");
        }}
      >
        <label htmlFor={dateId}>Practice date</label>
        <div className="log-practice-row">
          <input
            type="date"
            id={dateId}
            name="date"
            defaultValue={today()}
            max={today()}
            required
          />
          <button
            className="button button-primary"
            type="submit"
            disabled={busy}
          >
            <Icon name="plus" />
            Log practice
          </button>
        </div>
        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      <h3>History</h3>
      {problem.history.length ? (
        <ul className="practice-history">
          {[...problem.history]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((entry) => (
              <li key={entry.id}>
                <span>
                  <time
                    dateTime={entry.date}
                    title={formatDate(entry.date, true)}
                  >
                    {formatDate(entry.date)}
                  </time>{" "}
                  — practised
                </span>
                <button
                  className="icon-button"
                  disabled={busy}
                  onClick={async () => {
                    setError((await onDelete(problem.id, entry.id)) ?? "");
                  }}
                  aria-label={`Delete practice on ${formatDate(entry.date, true)}`}
                >
                  <Icon name="trash" />
                </button>
              </li>
            ))}
        </ul>
      ) : (
        <p className="no-practice">No practice logged yet.</p>
      )}
    </div>
  );
}
