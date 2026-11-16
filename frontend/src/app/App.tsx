import { LibraryPage } from "../features/library/LibraryPage";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { useTheme } from "./useTheme";
import { useEffect } from "react";
import { useLibrary } from "../features/library/useLibrary";
import { TaskPage } from "../features/problem/TaskPage";
import { useSolutions } from "../features/problem/useSolutions";
import { usePageRoute } from "./usePageRoute";

export function App() {
  const { theme, toggleTheme } = useTheme();
  const library = useLibrary();
  const solutions = useSolutions();
  const route = usePageRoute();
  const path = route.url.split(/[?#]/)[0];
  const problem = library.problems.find(
    (item) => path === `/problems/${encodeURIComponent(item.lcSlug)}`,
  );
  const detailRoute = path !== "/";
  useEffect(() => {
    document.title = problem
      ? `${problem.title} · Patterna`
      : detailRoute
        ? "Problem not found · Patterna"
        : "Problem library · Patterna";
  }, [problem?.title, detailRoute]);
  return (
    <div
      id="top"
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const anchor = (event.target as Element).closest("a");
        if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
        const href = anchor.getAttribute("href");
        if (href === "#top") {
          event.preventDefault();
          document.getElementById("top")?.scrollIntoView();
          return;
        }
        if (
          href === "/" ||
          href === "/#library" ||
          href?.startsWith("/problems/")
        ) {
          event.preventDefault();
          route.navigate(href);
        }
      }}
    >
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main");
          if (main) {
            main.tabIndex = -1;
            main.focus({ preventScroll: true });
          }
        }}
      >
        Skip to problems
      </a>
      {!detailRoute ? (
        <SiteHeader theme={theme} onToggleTheme={toggleTheme} />
      ) : null}
      <LibraryPage library={library} active={!detailRoute} />
      {problem ? (
        <TaskPage
          key={problem.id}
          problem={problem}
          library={library}
          solutions={solutions}
          theme={theme}
          onTheme={toggleTheme}
          onDirtyChange={route.setDirty}
        />
      ) : detailRoute ? (
        <main id="main" className="workspace missing-problem">
          <h1>Problem not found</h1>
          <p>This problem isn’t in your catalogue.</p>
          <a className="button button-primary" href="/">
            Back to problem library
          </a>
        </main>
      ) : null}
      <SiteFooter />
    </div>
  );
}
