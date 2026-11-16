import { useEffect, useRef, useState } from "react";
import { Icon } from "../../shared/ui/Icon";
import {
  ActiveFilters,
  CollectionSelector,
  LibraryToolbar,
} from "./components/LibraryControls";
import type { SelectionFilter } from "./components/LibraryControls";
import { FilterDialog } from "./components/FilterDialog";
import { PracticeDialog } from "./components/PracticeDialog";
import { ProgressSummary } from "./components/ProgressSummary";
import { TopicSection } from "./components/TopicSection";
import { filterCount, inList, matchesFilters, sortProblems } from "./library";
import { readDefaultList, saveDefaultList } from "./storage";
import { emptyFilters, studyLists } from "./types";
import type {
  LibraryFilters,
  LibraryListId,
  SortOrder,
  TaskStatus,
} from "./types";
import type { LibraryController } from "./useLibrary";

type ActiveDialog = { kind: "practice"; problemId: number } | null;

export function LibraryPage({
  library,
  active,
}: {
  library: LibraryController;
  active: boolean;
}) {
  const [defaultList, setDefaultList] = useState(readDefaultList);
  const [list, setList] = useState<LibraryListId>(() => {
    const requested = new URLSearchParams(location.search).get("list");
    return (
      studyLists.find((value) => value.id === requested)?.id ??
      defaultList ??
      "nc250"
    );
  });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("list");
  const [filters, setFilters] = useState<LibraryFilters>(() => ({
    ...emptyFilters(),
    needsReview: new URLSearchParams(location.search).get("review") === "true",
  }));
  const [expanded, setExpanded] = useState(
    () =>
      new Set(
        filters.needsReview
          ? library.problems.map((problem) => problem.category)
          : ["Arrays & Hashing"],
      ),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [message, setMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const categories = [
    ...new Set(library.problems.map((problem) => problem.category)),
  ];
  const labels = [
    ...new Set(library.problems.flatMap((problem) => problem.tags)),
  ];
  const collection = library.problems.filter((problem) =>
    inList(problem, list),
  );
  const visible = sortProblems(
    collection.filter((problem) => matchesFilters(problem, search, filters)),
    sort,
  );
  const topics = categories.filter((category) =>
    visible.some((problem) => problem.category === category),
  );
  const count = filterCount(filters);
  const narrowed = Boolean(search.trim() || count);
  const allExpanded =
    topics.length > 0 && topics.every((topic) => expanded.has(topic));
  const activeProblem = library.problems.find(
    (problem) => problem.id === activeDialog?.problemId,
  );

  useEffect(() => {
    if (!active) return;
    function focusSearch(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !document.querySelector("dialog[open]")
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, [active]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  function applyFilters(next: LibraryFilters) {
    setFilters(next);
    setExpanded(
      new Set(
        search.trim() || filterCount(next) ? categories : ["Arrays & Hashing"],
      ),
    );
  }

  function clearFilters() {
    setSearch("");
    setFilters(emptyFilters());
    setExpanded(new Set(["Arrays & Hashing"]));
  }

  function removeFilter(key: SelectionFilter, value: string) {
    applyFilters({
      ...filters,
      [key]: filters[key].filter((item) => item !== value),
    });
  }

  function changeList(next: LibraryListId) {
    setList(next);
    setExpanded(new Set(narrowed ? categories : ["Arrays & Hashing"]));
  }

  function makeDefault() {
    const next = defaultList === list ? null : list;
    setDefaultList(next);
    saveDefaultList(next);
    setMessage(
      next
        ? `${studyLists.find((item) => item.id === next)!.name} is now your default list`
        : "Default list removed",
    );
  }

  function setStatus(id: number, status: TaskStatus) {
    library.setStatus(id, status);
    setMessage(`Status changed to ${status.toLowerCase()}`);
  }

  function toggleReview(id: number) {
    const problem = library.problems.find((value) => value.id === id)!;
    library.toggleReview(id);
    setMessage(
      problem.needsReview ? "Removed from review" : "Marked for another review",
    );
  }

  return (
    <main
      id={active ? "main" : undefined}
      className="workspace"
      hidden={!active}
    >
      <section className="library-heading" aria-labelledby="page-title">
        <div>
          <h1 id="page-title">Problem library</h1>
          <p>A little practice. A deeper understanding.</p>
        </div>
      </section>
      <section id="library" aria-label="Problem library">
        <CollectionSelector
          list={list}
          defaultList={defaultList}
          onList={changeList}
          onDefault={makeDefault}
        />
        <ProgressSummary
          problems={collection}
          reviewOnly={filters.needsReview}
          onReview={() =>
            applyFilters({ ...filters, needsReview: !filters.needsReview })
          }
        />
        <LibraryToolbar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setExpanded(
              new Set(
                value.trim() || count ? categories : ["Arrays & Hashing"],
              ),
            );
          }}
          searchRef={searchRef}
          sort={sort}
          onSort={setSort}
          filterCount={count}
          onFilters={() => setFiltersOpen(true)}
          allExpanded={allExpanded}
          onExpandAll={() =>
            setExpanded(allExpanded ? new Set() : new Set(topics))
          }
        />
        {count ? (
          <ActiveFilters
            filters={filters}
            onRemove={removeFilter}
            onRemoveReview={() =>
              applyFilters({ ...filters, needsReview: false })
            }
          />
        ) : null}
        <div className="results-meta">
          <p role="status" aria-live="polite">
            {narrowed
              ? `${visible.length} of ${collection.length}`
              : collection.length}{" "}
            {collection.length === 1 ? "problem" : "problems"} <span>·</span>{" "}
            {topics.length} {topics.length === 1 ? "topic" : "topics"}
          </p>
          {narrowed ? (
            <button className="text-button" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="topic-list">
          {topics.map((category) => (
            <TopicSection
              key={category}
              category={category}
              problems={visible.filter(
                (problem) => problem.category === category,
              )}
              collectionProblems={collection.filter(
                (problem) => problem.category === category,
              )}
              expanded={expanded.has(category)}
              onToggle={() =>
                setExpanded((current) => {
                  const next = new Set(current);
                  if (next.has(category)) next.delete(category);
                  else next.add(category);
                  return next;
                })
              }
              onStatus={setStatus}
              onReview={toggleReview}
              onPractice={(problemId) =>
                setActiveDialog({ kind: "practice", problemId })
              }
            />
          ))}
        </div>
        {!visible.length ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="search" />
            </span>
            <h2>No problems match</h2>
            <p>Try another search or adjust your filters.</p>
            <button className="button button-primary" onClick={clearFilters}>
              Clear search & filters
            </button>
          </div>
        ) : null}
      </section>
      {filtersOpen ? (
        <FilterDialog
          filters={filters}
          labels={labels}
          onApply={(next) => {
            applyFilters(next);
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
      {activeDialog?.kind === "practice" && activeProblem ? (
        <PracticeDialog
          problem={activeProblem}
          onLog={(id, date) => {
            library.logPractice(id, date);
            setMessage("Practice logged");
          }}
          onDelete={(id, entryId) => {
            library.deletePractice(id, entryId);
            setMessage("Practice entry deleted");
          }}
          onClose={() => setActiveDialog(null)}
        />
      ) : null}
      <div
        className={`toast${message ? " visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </main>
  );
}
