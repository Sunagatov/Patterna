import { useId, useState } from "react";
import { Icon } from "../../../shared/ui/Icon";
import type { Problem } from "../types";
import { TaskRow } from "./TaskRow";
import type { TaskActions } from "./TaskRow";

interface TopicProps extends TaskActions {
  category: string;
  problems: Problem[];
  collectionProblems: Problem[];
  expanded: boolean;
  onToggle: () => void;
}

export function TopicSection({
  category,
  problems,
  collectionProblems,
  expanded,
  onToggle,
  ...actions
}: TopicProps) {
  const [showAll, setShowAll] = useState(false);
  const panelId = useId();
  const solved = collectionProblems.filter(
    (problem) => problem.status === "Solved",
  ).length;
  const visible = showAll ? problems : problems.slice(0, 6);

  return (
    <section className={`topic-group${expanded ? " expanded" : ""}`}>
      <h2 className="topic-h2">
        <button
          className="topic-heading"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
        >
          <Icon name="chevronRight" className="topic-chevron" />
          <span className="topic-name">{category}</span>
          <span className="topic-size">
            {problems.length !== collectionProblems.length
              ? `${problems.length} of `
              : ""}
            {collectionProblems.length} problems
          </span>
          <span className="topic-stats">
            <span>
              <strong>{solved}</strong> / {collectionProblems.length}
              <span className="solved-word"> solved</span>
            </span>
            <span className="mini-progress" aria-hidden="true">
              <i
                style={{
                  width: `${(solved / collectionProblems.length) * 100}%`,
                }}
              />
            </span>
          </span>
        </button>
      </h2>
      <div id={panelId} hidden={!expanded}>
        {expanded ? (
          <>
            <table className="task-table">
              <caption className="sr-only">{category} problems</caption>
              <thead>
                <tr>
                  <th scope="col">Problem</th>
                  <th scope="col">Difficulty</th>
                  <th scope="col">Status</th>
                  <th scope="col">Practice</th>
                  <th scope="col">Review</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((problem) => (
                  <TaskRow key={problem.id} problem={problem} {...actions} />
                ))}
              </tbody>
            </table>
            {problems.length > 6 ? (
              <button
                className="more-problems"
                onClick={() => setShowAll((current) => !current)}
              >
                {showAll
                  ? "Show fewer problems"
                  : `Show ${problems.length - 6} more problems`}
                <Icon name="chevronDown" />
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
