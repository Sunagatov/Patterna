import type { Difficulty, Problem } from "../types";

const difficulties = [
  { label: "Easy", color: "easy" },
  { label: "Medium", color: "medium" },
  { label: "Hard", color: "hard" },
  { label: "Very Hard", color: "very-hard" },
] as const;

const arc = "M 30 90 A 42.43 42.43 0 1 1 90 90";
const segmentGap = 0.045;

export function ProgressSummary({
  listName,
  problems,
}: {
  listName: string;
  problems: Problem[];
}) {
  const counts: Record<Difficulty, { total: number; solved: number }> = {
    Easy: { total: 0, solved: 0 },
    Medium: { total: 0, solved: 0 },
    Hard: { total: 0, solved: 0 },
    "Very Hard": { total: 0, solved: 0 },
  };
  let solved = 0;
  for (const problem of problems) {
    const count = counts[problem.difficulty];
    count.total += 1;
    if (problem.status === "Solved") {
      count.solved += 1;
      solved += 1;
    }
  }

  const breakdown = difficulties.map((difficulty) => ({
    ...difficulty,
    ...counts[difficulty.label],
  }));
  const total = problems.length;
  const nonempty = breakdown.filter((difficulty) => difficulty.total > 0);
  const trackLength = 1 - segmentGap * Math.max(0, nonempty.length - 1);
  let start = 0;
  const segments = nonempty.map((difficulty) => {
    const length = (difficulty.total / total) * trackLength;
    const segment = {
      ...difficulty,
      start,
      length,
      fill: (difficulty.solved / total) * trackLength,
    };
    start += length + segmentGap;
    return segment;
  });

  return (
    <section
      className="progress-summary"
      aria-label="Progress in selected list"
    >
      <div className="progress-card">
        <h2 className="progress-card-title">{listName}</h2>
        <div className="progress-card-body">
          <dl className="difficulty-summary">
            {breakdown
              .filter(({ label, total }) => label !== "Very Hard" || total > 0)
              .map(({ label, color, solved, total }) => (
                <div className="difficulty-stat" key={label}>
                  <dt className={color}>{label}</dt>
                  <dd>
                    {solved}
                    <span> / {total}</span>
                    <span className="sr-only"> solved</span>
                  </dd>
                </div>
              ))}
          </dl>
          <div
            className="progress-gauge"
            role="progressbar"
            aria-label="Problems solved"
            aria-valuemin={0}
            aria-valuemax={total || 1}
            aria-valuenow={solved}
            aria-valuetext={`${solved} of ${total} problems solved`}
          >
            <svg
              className="progress-arc"
              viewBox="0 10 120 100"
              fill="none"
              aria-hidden="true"
            >
              {total === 0 ? (
                <path className="progress-empty" d={arc} />
              ) : (
                segments.map(({ label, color, start, length, fill }) => (
                  <g className={color} key={label} stroke="currentColor">
                    <path
                      className="progress-segment-track"
                      d={arc}
                      pathLength={1}
                      strokeDasharray={`${length} 1`}
                      strokeDashoffset={-start}
                    />
                    {fill > 0 ? (
                      <path
                        d={arc}
                        pathLength={1}
                        strokeDasharray={`${fill} 1`}
                        strokeDashoffset={-start}
                      />
                    ) : null}
                  </g>
                ))
              )}
            </svg>
            <div className="progress-gauge-value" aria-hidden="true">
              <strong>{solved}</strong>
              <span>/ {total}</span>
              <small>Solved</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
