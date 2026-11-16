import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Brand } from "../../app/Brand";
import type { Theme } from "../../app/useTheme";
import { Icon } from "../../shared/ui/Icon";
import {
  PracticeContent,
  PracticeDialog,
} from "../library/components/PracticeDialog";
import { StatusSelect } from "../library/components/TaskRow";
import type { Problem } from "../library/types";
import type { LibraryController } from "../library/useLibrary";
import { ProblemContent } from "./ProblemContent";
import { SolutionWorkspace } from "./SolutionWorkspace";
import type { SolutionsController } from "./useSolutions";
import "./task-page.css";

export const problemPath = (problem: Problem) =>
  `/problems/${encodeURIComponent(problem.lcSlug)}`;

interface Props {
  problem: Problem;
  library: LibraryController;
  solutions: SolutionsController;
  theme: Theme;
  onTheme: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function TaskPage({
  problem,
  library,
  solutions,
  theme,
  onTheme,
  onDirtyChange,
}: Props) {
  const [leftTab, setLeftTab] = useState<"question" | "practice">("question");
  const [mobilePane, setMobilePane] = useState<"problem" | "solutions">(
    "problem",
  );
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [split, setSplit] = useState(44);
  const panels = useRef<HTMLDivElement>(null);
  const index = library.problems.findIndex((item) => item.id === problem.id);
  const previous = library.problems[index - 1];
  const next = library.problems[index + 1];
  function resize(clientX: number) {
    if (!panels.current) return;
    const bounds = panels.current.getBoundingClientRect();
    setSplit(
      Math.min(
        65,
        Math.max(30, ((clientX - bounds.left) / bounds.width) * 100),
      ),
    );
  }
  return (
    <main id="main" className="task-page">
      <header className="task-appbar">
        <Brand />
        <span className="appbar-divider" />
        <a className="library-back" href="/">
          <Icon name="arrowLeft" />
          <span>Problem library</span>
        </a>
        <div className="task-navigation">
          {previous ? (
            <a
              className="icon-button"
              href={problemPath(previous)}
              aria-label={`Previous problem: ${previous.title}`}
            >
              <Icon name="chevronLeft" />
            </a>
          ) : (
            <span className="icon-button navigation-placeholder" />
          )}
          {next ? (
            <a
              className="icon-button"
              href={problemPath(next)}
              aria-label={`Next problem: ${next.title}`}
            >
              <Icon name="chevronRight" />
            </a>
          ) : null}
        </div>
        <span className="pane-heading-spacer" />
        <StatusSelect problem={problem} onChange={library.setStatus} />
        <button
          className="task-review-button"
          aria-pressed={problem.needsReview}
          aria-label="Needs review"
          title="Needs review"
          onClick={() => library.toggleReview(problem.id)}
        >
          <Icon name="bookmark" />
          <span>Needs review</span>
        </button>
        <button
          className="task-log-button"
          onClick={() => setPracticeOpen(true)}
        >
          <Icon name="repeat" />
          <span>Log practice</span>
        </button>
        <button
          className="icon-button"
          onClick={onTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          <Icon name={theme === "light" ? "moon" : "sun"} />
        </button>
      </header>
      <p className="mobile-current-task">{problem.title}</p>
      <div className="mobile-workspace-switch" aria-label="Workspace view">
        <button
          aria-pressed={mobilePane === "problem"}
          onClick={() => setMobilePane("problem")}
        >
          <Icon name="file" />
          Problem
        </button>
        <button
          aria-pressed={mobilePane === "solutions"}
          onClick={() => setMobilePane("solutions")}
        >
          <Icon name="code" />
          Solutions
          <span>
            {
              solutions.entries.filter(
                (entry) => entry.problemId === problem.id,
              ).length
            }
          </span>
        </button>
      </div>
      <div
        ref={panels}
        className={`task-panels mobile-${mobilePane}`}
        style={{ "--problem-split": `${split}%` } as CSSProperties}
      >
        <section className="question-pane" aria-label="Problem and practice">
          <div className="pane-heading question-tabs" aria-label="Problem view">
            <button
              aria-pressed={leftTab === "question"}
              onClick={() => setLeftTab("question")}
            >
              <Icon name="file" />
              Question
            </button>
            <button
              aria-pressed={leftTab === "practice"}
              onClick={() => setLeftTab("practice")}
            >
              <Icon name="repeat" />
              Practice history
              <span className="pane-count">{problem.history.length}</span>
            </button>
          </div>
          <div className="question-scroll">
            {leftTab === "question" ? (
              <ProblemContent key={problem.id} problem={problem} />
            ) : (
              <PracticeContent
                problem={problem}
                onLog={library.logPractice}
                onDelete={library.deletePractice}
              />
            )}
          </div>
        </section>
        <div
          className="pane-resizer"
          role="separator"
          aria-label="Resize problem and solution panes"
          aria-orientation="vertical"
          aria-valuemin={30}
          aria-valuemax={65}
          aria-valuenow={Math.round(split)}
          tabIndex={0}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            resize(event.clientX);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              resize(event.clientX);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              setSplit((value) =>
                Math.min(
                  65,
                  Math.max(30, value + (event.key === "ArrowLeft" ? -2 : 2)),
                ),
              );
            }
          }}
        >
          <span />
        </div>
        <SolutionWorkspace
          key={problem.id}
          problemId={problem.id}
          solutions={solutions}
          onDirtyChange={onDirtyChange}
        />
      </div>
      {practiceOpen ? (
        <PracticeDialog
          problem={problem}
          onLog={library.logPractice}
          onDelete={library.deletePractice}
          onClose={() => setPracticeOpen(false)}
        />
      ) : null}
    </main>
  );
}
