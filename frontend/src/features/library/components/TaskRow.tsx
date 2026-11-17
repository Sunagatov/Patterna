import { Icon } from "../../../shared/ui/Icon";
import { taskStatuses } from "../types";
import type { Problem, TaskStatus } from "../types";
import type { LibraryController } from "../useLibrary";

export interface TaskActions {
  onStatus: (id: number, status: TaskStatus) => void;
  onReview: (id: number) => void;
  onPractice: (id: number) => void;
  isProgressPending: LibraryController["isProgressPending"];
}

export function StatusSelect({
  problem,
  onChange,
  disabled,
}: {
  problem: Problem;
  onChange: (id: number, status: TaskStatus) => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`status-control status-${problem.status.toLowerCase().replaceAll(" ", "-")}`}
    >
      <select
        aria-label={`Status for ${problem.title}`}
        value={problem.status}
        disabled={disabled}
        onChange={(event) =>
          onChange(problem.id, event.target.value as TaskStatus)
        }
      >
        {taskStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <Icon name="chevronDown" />
    </div>
  );
}

export function TaskRow({
  problem,
  onStatus,
  onReview,
  onPractice,
  isProgressPending,
}: TaskActions & { problem: Problem }) {
  const count = problem.history.length;
  return (
    <tr>
      <td>
        <a
          className="problem-name"
          href={`/problems/${encodeURIComponent(problem.lcSlug)}`}
        >
          {problem.title}
          <Icon name="arrowUpRight" />
        </a>
      </td>
      <td>
        <span
          className={`difficulty-label ${problem.difficulty.toLowerCase().replace(" ", "-")}`}
        >
          {problem.difficulty}
        </span>
      </td>
      <td>
        <StatusSelect
          problem={problem}
          onChange={onStatus}
          disabled={isProgressPending(problem.id, "status")}
        />
      </td>
      <td>
        <button
          className="practice-button"
          onClick={() => onPractice(problem.id)}
          aria-label={`Practice history for ${problem.title}: ${count} times`}
        >
          <span>
            {count
              ? `${count} ${count === 1 ? "time" : "times"}`
              : "Log practice"}
          </span>
        </button>
      </td>
      <td className="review-cell">
        <button
          className="review-toggle"
          onClick={() => onReview(problem.id)}
          disabled={isProgressPending(problem.id, "needsReview")}
          aria-pressed={problem.needsReview}
          aria-label={`Needs review: ${problem.title}`}
          title={problem.needsReview ? "Remove from review" : "Mark for review"}
        >
          <Icon name="bookmark" />
        </button>
      </td>
    </tr>
  );
}
