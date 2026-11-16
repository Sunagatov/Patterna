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
      </div>
      {hasDemoDescription ? <ConcatenationDescription /> : null}
      <section className="question-section">
        <h2>Topics & patterns</h2>
        <div className="detail-tags">
          {problem.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>
      <section className="question-section">
        <h2>Study lists</h2>
        <div className="detail-tags">
          {problem.lists.map((id) => (
            <span key={id}>
              {studyLists.find((list) => list.id === id)?.name}
            </span>
          ))}
        </div>
      </section>
      {hasDemoDescription ? (
        <p className="source-attribution">
          Patterna demonstration description and examples.
        </p>
      ) : null}
    </article>
  );
}
