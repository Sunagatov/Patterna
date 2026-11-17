import type { components } from "../../api/schema";
import { formatInline } from "./FormattedThoughts";

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <>
      <h2>{title}</h2>
      <ul aria-label={title}>
        {items.map((item, index) => (
          <li key={index}>{formatInline(item)}</li>
        ))}
      </ul>
    </>
  );
}

export function QuestionDetails({
  question,
}: {
  question: components["schemas"]["ProblemQuestion"];
}) {
  return (
    <section className="problem-description" aria-label="Task description">
      {question.description.map((paragraph, index) => (
        <p key={index}>{formatInline(paragraph)}</p>
      ))}
      {question.examples.map((example, index) => (
        <div key={index}>
          <h2>Example {index + 1}</h2>
          <div className="problem-example">
            <pre>
              <span>Input:</span> {example.input}
              {"\n"}
              <span>Output:</span> {example.output}
            </pre>
            {example.explanation ? (
              <p>{formatInline(example.explanation)}</p>
            ) : null}
          </div>
        </div>
      ))}
      <DetailList title="Requirements" items={question.requirements ?? []} />
      <DetailList title="Constraints" items={question.constraints} />
      <DetailList title="Follow-up" items={question.followUps ?? []} />
      {question.hints?.length ? (
        <details>
          <summary>{question.hints.length === 1 ? "Hint" : "Hints"}</summary>
          {question.hints.map((hint, index) => (
            <p key={index}>{formatInline(hint)}</p>
          ))}
        </details>
      ) : null}
    </section>
  );
}
