import { useEffect, useState } from "react";
import { api, errorMessage } from "../../api/client";
import type { components } from "../../api/schema";
import { studyLists } from "../library/types";
import type { Problem } from "../library/types";
import { ConcatenationDescription } from "./ConcatenationDescription";
import { QuestionDetails } from "./QuestionDetails";

export function ProblemContent({ problem }: { problem: Problem }) {
  const [question, setQuestion] = useState<
    components["schemas"]["ProblemQuestion"] | null
  >(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const problemId = problem.id;
  const showDemo = problem.lcSlug === "concatenation-of-array";

  useEffect(() => {
    const request = new AbortController();
    api
      .GET("/api/problems/{problem_id}/question", {
        params: { path: { problem_id: problemId } },
        signal: request.signal,
      })
      .then(({ data }) => {
        if (request.signal.aborted) return;
        setQuestion(data ?? null);
        setStatus("loaded");
      })
      .catch((failure) => {
        if (request.signal.aborted) return;
        setError(errorMessage(failure));
        setStatus("error");
      });
    return () => request.abort();
  }, [problemId, attempt]);

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
      {question ? <QuestionDetails question={question} /> : null}
      {status === "loaded" && !question && showDemo ? (
        <ConcatenationDescription />
      ) : null}
      {status === "loaded" && !question && !showDemo ? (
        <p>
          <a
            href={`https://leetcode.com/problems/${encodeURIComponent(problem.lcSlug)}/`}
            target="_blank"
            rel="noreferrer"
          >
            View the problem on LeetCode
          </a>
        </p>
      ) : null}
      {status === "loading" ? <p role="status">Loading question…</p> : null}
      {status === "error" ? (
        <>
          <p role="alert">{error}</p>
          <button
            className="button"
            onClick={() => {
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}
          >
            Retry
          </button>
        </>
      ) : null}
    </article>
  );
}
