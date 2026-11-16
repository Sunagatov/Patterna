import { Icon } from "../../../shared/ui/Icon";
import type { Difficulty, Problem } from "../types";

export function ProgressSummary({
  problems,
  reviewOnly,
  onReview,
}: {
  problems: Problem[];
  reviewOnly: boolean;
  onReview: () => void;
}) {
  const solved = problems.filter(
    (problem) => problem.status === "Solved",
  ).length;
  const review = problems.filter((problem) => problem.needsReview).length;
  const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];
  if (problems.some((problem) => problem.difficulty === "Very Hard"))
    difficulties.push("Very Hard");

  return (
    <section
      className="progress-summary"
      aria-label="Progress in selected list"
    >
      <div className="overall-progress">
        <div className="overall-numbers">
          <strong>{solved}</strong>
          <span>/ {problems.length} solved</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Problems solved"
          aria-valuemin={0}
          aria-valuemax={problems.length}
          aria-valuenow={solved}
        >
          <span
            style={{
              width: `${problems.length ? (solved / problems.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <div className="difficulty-summary">
        {difficulties.map((difficulty) => (
          <div className="difficulty-stat" key={difficulty}>
            <strong className={difficulty.toLowerCase().replace(" ", "-")}>
              {difficulty}
            </strong>
            <span>
              {
                problems.filter(
                  (problem) =>
                    problem.difficulty === difficulty &&
                    problem.status === "Solved",
                ).length
              }
              <small>
                {" "}
                /{" "}
                {
                  problems.filter(
                    (problem) => problem.difficulty === difficulty,
                  ).length
                }
              </small>
            </span>
          </div>
        ))}
      </div>
      <button
        className="summary-review"
        aria-pressed={reviewOnly}
        onClick={onReview}
      >
        <Icon name="bookmark" />
        <span>
          <strong>{review}</strong> need review
        </span>
        <Icon name="arrowUpRight" />
      </button>
    </section>
  );
}
