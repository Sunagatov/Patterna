import { studyLists } from "../library/types";
import type { Problem } from "../library/types";
import { ConcatenationDescription } from "./ConcatenationDescription";

export function ProblemContent({ problem }: { problem: Problem }) {
  const hasDemoDescription = problem.lcSlug === "concatenation-of-array";
  return (
    <article className="question-content">
      <h1 tabIndex={-1}>{problem.title}</h1>
      <div className="question-badges">
        <span
          className={`difficulty-label ${problem.difficulty.toLowerCase().replace(" ", "-")}`}
        >
          {problem.difficulty}
        </span>
        <span>{problem.category}</span>
        {problem.lists.map((id) => (
          <span key={id}>
            {studyLists.find((list) => list.id === id)?.name}
          </span>
        ))}
      </div>
      {hasDemoDescription ? <ConcatenationDescription /> : null}
    </article>
  );
}
