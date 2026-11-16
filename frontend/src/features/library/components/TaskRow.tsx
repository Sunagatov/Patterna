import { Icon } from "../../../shared/ui/Icon";
import { formatDate, lastPractised } from "../library";
import { taskStatuses } from "../types";
import type { Problem, TaskStatus } from "../types";

export interface TaskActions {
  onStatus: (id: number, status: TaskStatus) => void;
  onReview: (id: number) => void;
  onPractice: (id: number) => void;
  onPreview: (id: number) => void;
}

export function StatusSelect({
  problem,
  onChange,
}: {
  problem: Problem;
  onChange: (id: number, status: TaskStatus) => void;
}) {
  return (
    <div
      className={`status-control status-${problem.status.toLowerCase().replaceAll(" ", "-")}`}
    >
      <select
        aria-label={`Status for ${problem.title}`}
        value={problem.status}
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
  onPreview,
}: TaskActions & { problem: Problem }) {
  const date = lastPractised(problem);
  const count = problem.history.length;
  return (
    <tr>
      <td>
        <button className="problem-name" onClick={() => onPreview(problem.id)}>
          {problem.title}
          <Icon name="arrowUpRight" />
        </button>
        <div className="platform-links">
          <a
            href={`https://leetcode.com/problems/${problem.lcSlug}/`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${problem.title} on LeetCode`}
          >
            LC
          </a>
          <span>·</span>
          <a
            href={`https://neetcode.io/problems/${problem.ncSlug}/question?list=neetcode250`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${problem.title} on NeetCode`}
          >
            NC
          </a>
        </div>
      </td>
      <td>
        <span
          className={`difficulty-label ${problem.difficulty.toLowerCase().replace(" ", "-")}`}
        >
          {problem.difficulty}
        </span>
      </td>
      <td>
        <StatusSelect problem={problem} onChange={onStatus} />
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
          <small>{date ? formatDate(date) : "Not practised"}</small>
        </button>
      </td>
      <td className="review-cell">
        <button
          className="review-toggle"
          onClick={() => onReview(problem.id)}
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
