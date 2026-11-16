import { Dialog } from "../../../shared/ui/Dialog";
import { Icon } from "../../../shared/ui/Icon";
import type { Problem, TaskStatus } from "../types";
import { StatusSelect } from "./TaskRow";

export function ProblemPreview({
  problem,
  onStatus,
  onReview,
  onPractice,
  onClose,
}: {
  problem: Problem;
  onStatus: (id: number, status: TaskStatus) => void;
  onReview: (id: number) => void;
  onPractice: (id: number) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={problem.title}
      subtitle={problem.category}
      className="task-dialog"
      onClose={onClose}
    >
      <div className="task-preview-body">
        <div className="task-preview-meta">
          <span
            className={`difficulty-label ${problem.difficulty.toLowerCase().replace(" ", "-")}`}
          >
            {problem.difficulty}
          </span>
          <StatusSelect problem={problem} onChange={onStatus} />
        </div>
        <p className="task-preview-intro">
          Choose a platform to read this problem.
        </p>
        <div className="task-source-links">
          <a
            className="button button-primary"
            href={`https://leetcode.com/problems/${problem.lcSlug}/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LeetCode <Icon name="arrowUpRight" />
          </a>
          <a
            className="button"
            href={`https://neetcode.io/problems/${problem.ncSlug}/question?list=neetcode250`}
            target="_blank"
            rel="noopener noreferrer"
          >
            NeetCode <Icon name="arrowUpRight" />
          </a>
        </div>
        <div className="task-preview-actions">
          <button className="button" onClick={() => onPractice(problem.id)}>
            <Icon name="repeat" />
            Practice history
          </button>
          <button
            className="button"
            aria-pressed={problem.needsReview}
            onClick={() => onReview(problem.id)}
          >
            <Icon name="bookmark" />
            {problem.needsReview ? "Marked for review" : "Needs review"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
