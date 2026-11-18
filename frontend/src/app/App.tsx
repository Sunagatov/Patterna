import { LibraryPage } from "../features/library/LibraryPage";
import { LibraryHeader, SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { useTheme } from "./useTheme";
import { useEffect, useRef, useState } from "react";
import { api, ApiError, errorMessage } from "../api/client";
import type { ApiWorkspace } from "../api/client";
import { readBrowserImport, rememberBrowserImport } from "../api/browserImport";
import { SignIn } from "./SignIn";
import { useLibrary } from "../features/library/useLibrary";
import { TaskPage } from "../features/problem/TaskPage";
import { useSolutions } from "../features/problem/useSolutions";
import { usePageRoute } from "./usePageRoute";

export function App() {
  const [workspace, setWorkspace] = useState<ApiWorkspace | null>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api
      .GET("/api/workspace", { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted && data) setWorkspace(data);
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401)
          setWorkspace(null);
        else setError(errorMessage(failure));
      });
    return () => controller.abort();
  }, [attempt]);
  if (workspace === null)
    return (
      <>
        <SiteHeader />
        <SignIn onSignIn={setWorkspace} />
      </>
    );
  if (!workspace)
    return (
      <>
        <SiteHeader />
        <main className="workspace">
          {error ? (
            <>
              <p role="alert">{error}</p>
              <button
                className="button"
                onClick={() => {
                  setError("");
                  setAttempt((value) => value + 1);
                }}
              >
                Retry
              </button>
            </>
          ) : (
            <p role="status">Loading Patterna…</p>
          )}
        </main>
      </>
    );
  return (
    <WorkspaceApp initial={workspace} onSignOut={() => setWorkspace(null)} />
  );
}

function WorkspaceApp({
  initial,
  onSignOut,
}: {
  initial: ApiWorkspace;
  onSignOut: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const library = useLibrary(initial.problems);
  const solutions = useSolutions(initial.solutions);
  const [legacy] = useState(() => {
    try {
      return { data: readBrowserImport(), error: "" };
    } catch {
      return {
        data: null,
        error:
          "Some older browser data could not be read. It was left in this browser.",
      };
    }
  });
  const [message, setMessage] = useState(legacy.error);
  const [imported, setImported] = useState(false);
  const [busy, setBusy] = useState(false);
  const route = usePageRoute();
  const path = route.url.split(/[?#]/)[0];
  const focusedPath = useRef(path);
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
    if (focusedPath.current !== path) {
      focusedPath.current = path;
      document.getElementById("main")?.focus({ preventScroll: true });
    }
  }, [problem?.title, detailRoute, path]);
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
          document.getElementById("main")?.focus({ preventScroll: true });
        }}
      >
        Skip to content
      </a>
      {!detailRoute ? (
        <LibraryHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          onSignOut={async () => {
            try {
              await api.DELETE("/api/session");
              onSignOut();
            } catch (failure) {
              setMessage(errorMessage(failure));
            }
          }}
        />
      ) : !problem ? (
        <SiteHeader />
      ) : null}
      {!detailRoute && (message || (legacy.data && !imported)) ? (
        <div className="account-notice">
          {message ? <p role="status">{message}</p> : null}
          {legacy.data && !imported ? (
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                const payload = legacy.data;
                if (!payload) return;
                setBusy(true);
                try {
                  rememberBrowserImport(payload.id);
                  const { data } = await api.POST("/api/browser-import", {
                    body: payload,
                  });
                  if (!data) throw new Error("Missing import result");
                  library.replaceProblems(data.problems);
                  solutions.replaceEntries(data.solutions);
                  setImported(true);
                  try {
                    localStorage.setItem(
                      "patterna.browser-import.completed.v1",
                      payload.id,
                    );
                  } catch {
                    /* The server retains the import ID for safe retries. */
                  }
                  setMessage(
                    "Browser data imported. Existing server records were kept.",
                  );
                } catch (failure) {
                  setMessage(errorMessage(failure));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Importing…" : "Import previous browser data"}
            </button>
          ) : null}
        </div>
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
        <main id="main" tabIndex={-1} className="workspace missing-problem">
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
