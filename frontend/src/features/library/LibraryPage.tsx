import { useEffect, useRef, useState } from "react";
import { Icon } from "../../shared/ui/Icon";
import {
  ActiveFilters,
  BackToTopButton,
  CollectionSelector,
  LibraryToolbar,
} from "./components/LibraryControls";
import type { SelectionFilter } from "./components/LibraryControls";
import { FilterDialog } from "./components/FilterDialog";
import { PracticeDialog } from "./components/PracticeDialog";
import { ProgressSummary } from "./components/ProgressSummary";
import { PracticeCalendar } from "./components/PracticeCalendar";
import { TopicSection, TopicTable } from "./components/TopicSection";
import {
  filterCount,
  groupByTopic,
  inList,
  matchesFilters,
  sortProblems,
  topicForList,
} from "./library";
import {
  readDefaultList,
  readListView,
  saveDefaultList,
  saveListView,
} from "./storage";
import { emptyFilters, studyLists } from "./types";
import type {
  LibraryFilters,
  LibraryListId,
  SortOrder,
  TaskStatus,
} from "./types";
import type { LibraryController } from "./useLibrary";

type ActiveDialog =
  { kind: "filters" } | { kind: "practice"; problemId: number } | null;

const listViewBatchSize = 250;

export function LibraryPage({
  library,
  active,
}: {
  library: LibraryController;
  active: boolean;
}) {
  const [defaultList, setDefaultList] = useState(readDefaultList);
  const [selectedList, setList] = useState<LibraryListId>(() => {
    const requested = new URLSearchParams(location.search).get("list");
    return (
      studyLists.find((value) => value.id === requested)?.id ??
      defaultList ??
      "nc250"
    );
  });
  const availableLists = studyLists.filter(
    (item) =>
      library.problems.some((problem) => inList(problem, item.id)) ||
      item.id === "all",
  );
  const { id: list, name: listName } =
    availableLists.find((item) => item.id === selectedList) ??
    availableLists[0];
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("list");
  const [listView, setListView] = useState(readListView);
  const [tableLimit, setTableLimit] = useState(listViewBatchSize);
  const [filters, setFilters] = useState<LibraryFilters>(() => ({
    ...emptyFilters(),
    needsReview: new URLSearchParams(location.search).get("review") === "true",
  }));
  const [expanded, setExpanded] = useState(
    () =>
      new Set(
        filters.needsReview
          ? library.problems.map((problem) => topicForList(problem, list))
          : ["Arrays & Hashing"],
      ),
  );
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [message, setMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const labels = [
    ...new Set(library.problems.flatMap((problem) => problem.tags)),
  ];
  const collection = library.problems.filter((problem) =>
    inList(problem, list),
  );
  const reviewCount = collection.filter(
    (problem) => problem.needsReview,
  ).length;
  const collectionGroups = groupByTopic(collection, list);
  const categories = [...collectionGroups.keys()];
  const visible = sortProblems(
    collection.filter((problem) =>
      matchesFilters(problem, search, filters, list),
    ),
    sort,
  );
  const visibleGroups = groupByTopic(visible, list);
  const topics = categories.filter((category) => visibleGroups.has(category));
  const tableGroups = listView
    ? groupByTopic(
        topics
          .flatMap((category) => visibleGroups.get(category) ?? [])
          .slice(0, tableLimit),
        list,
      )
    : new Map<string, never>();
  const count = filterCount(filters);
  const narrowed = Boolean(search.trim() || count);
  const allExpanded =
    topics.length > 0 && topics.every((topic) => expanded.has(topic));
  const activeProblem =
    activeDialog?.kind === "practice"
      ? library.problems.find(
          (problem) => problem.id === activeDialog.problemId,
        )
      : undefined;

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
    if (!active) setActiveDialog(null);
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
    setTableLimit(listViewBatchSize);
    setExpanded(
      new Set(
        narrowed
          ? library.problems.map((problem) => topicForList(problem, next))
          : ["Arrays & Hashing"],
      ),
    );
  }

  function toggleListView() {
    const next = !listView;
    setListView(next);
    setTableLimit(listViewBatchSize);
    saveListView(next);
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

  async function setStatus(id: number, status: TaskStatus) {
    const error = await library.setStatus(id, status);
    setMessage(error ?? `Status changed to ${status.toLowerCase()}`);
  }

  async function toggleReview(id: number) {
    const problem = library.problems.find((value) => value.id === id)!;
    const error = await library.toggleReview(id);
    setMessage(
      error ??
        (problem.needsReview
          ? "Removed from review"
          : "Marked for another review"),
    );
  }

  const taskActions = {
    onStatus: setStatus,
    onReview: toggleReview,
    isProgressPending: library.isProgressPending,
    onPractice: (problemId: number) =>
      setActiveDialog({ kind: "practice", problemId }),
  };

  return (
    <main
      id={active ? "main" : undefined}
      tabIndex={-1}
      className="workspace library-workspace"
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
          options={availableLists}
          defaultList={defaultList}
          onList={changeList}
          onDefault={makeDefault}
        />
        <div className="library-columns">
          <div className="library-sidebar">
            <ProgressSummary listName={listName} problems={collection} />
            <PracticeCalendar problems={library.problems} />
          </div>
          <div className="library-results">
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
              onFilters={() => setActiveDialog({ kind: "filters" })}
              listView={listView}
              onToggleView={toggleListView}
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
                {collection.length === 1 ? "problem" : "problems"}{" "}
                <span>·</span> {topics.length}{" "}
                {topics.length === 1 ? "topic" : "topics"}
              </p>
              <div className="results-meta-actions">
                <button
                  type="button"
                  className="summary-review"
                  aria-pressed={filters.needsReview}
                  onClick={() =>
                    applyFilters({
                      ...filters,
                      needsReview: !filters.needsReview,
                    })
                  }
                >
                  <Icon name="bookmark" />
                  <span>
                    <strong>{reviewCount}</strong> need review
                  </span>
                </button>
                {narrowed ? (
                  <button className="text-button" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>
            {listView ? (
              <div className="topic-list topic-list-tables">
                {Array.from(tableGroups, ([category, problems]) => (
                  <TopicTable
                    key={category}
                    category={category}
                    problems={problems}
                    {...taskActions}
                  />
                ))}
                {visible.length > tableLimit ? (
                  <button
                    className="button list-view-more"
                    type="button"
                    onClick={() =>
                      setTableLimit((limit) => limit + listViewBatchSize)
                    }
                  >
                    Show{" "}
                    {Math.min(listViewBatchSize, visible.length - tableLimit)}{" "}
                    more problems
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="topic-list">
                {topics.map((category) => (
                  <TopicSection
                    key={category}
                    category={category}
                    problems={visibleGroups.get(category) ?? []}
                    collectionProblems={collectionGroups.get(category) ?? []}
                    expanded={expanded.has(category)}
                    onToggle={() =>
                      setExpanded((current) => {
                        const next = new Set(current);
                        if (next.has(category)) next.delete(category);
                        else next.add(category);
                        return next;
                      })
                    }
                    {...taskActions}
                  />
                ))}
              </div>
            )}
            {!visible.length ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon name="search" />
                </span>
                <h2>No problems match</h2>
                <p>Try another search or adjust your filters.</p>
                <button
                  className="button button-primary"
                  onClick={clearFilters}
                >
                  Clear search & filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      {active && activeDialog?.kind === "filters" ? (
        <FilterDialog
          filters={filters}
          labels={labels}
          onApply={(next) => {
            applyFilters(next);
            setActiveDialog(null);
          }}
          onClose={() => setActiveDialog(null)}
        />
      ) : null}
      {active && activeProblem ? (
        <PracticeDialog
          problem={activeProblem}
          onLog={library.logPractice}
          onDelete={library.deletePractice}
          onClose={() => setActiveDialog(null)}
        />
      ) : null}
      {active ? <BackToTopButton /> : null}
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
