import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { Icon } from "../../../shared/ui/Icon";
import { studyLists } from "../types";
import type { LibraryFilters, LibraryListId, SortOrder } from "../types";

export type SelectionFilter =
  "difficulties" | "statuses" | "labels" | "platforms";

interface ControlsProps {
  list: LibraryListId;
  defaultList: LibraryListId | null;
  onList: (list: LibraryListId) => void;
  onDefault: () => void;
  search: string;
  onSearch: (search: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  sort: SortOrder;
  onSort: (sort: SortOrder) => void;
  filterCount: number;
  onFilters: () => void;
  listView: boolean;
  onToggleView: () => void;
  allExpanded: boolean;
  onExpandAll: () => void;
}

export function CollectionSelector({
  list,
  options,
  defaultList,
  onList,
  onDefault,
}: Pick<ControlsProps, "list" | "defaultList" | "onList" | "onDefault"> & {
  options: typeof studyLists;
}) {
  const isDefault = list === defaultList;
  const name = studyLists.find((item) => item.id === list)!.name;
  return (
    <div className="collection-row">
      <div className="select-wrap collection-select">
        <label className="sr-only" htmlFor="study-list">
          Study list
        </label>
        <select
          id="study-list"
          value={list}
          onChange={(event) => onList(event.target.value as LibraryListId)}
        >
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" />
      </div>
      <button
        className="default-star"
        aria-pressed={isDefault}
        onClick={onDefault}
        aria-label={
          isDefault
            ? `${name} is your default list. Remove as default`
            : `Make ${name} your default list`
        }
        title={
          isDefault
            ? "Remove as default"
            : "Open this list when you visit Patterna"
        }
      >
        <Icon name="star" />
      </button>
      <span className="default-label">
        {isDefault ? "Default list" : "Set as default"}
      </span>
    </div>
  );
}

export function LibraryToolbar({
  search,
  onSearch,
  searchRef,
  sort,
  onSort,
  filterCount,
  onFilters,
  listView,
  onToggleView,
  allExpanded,
  onExpandAll,
}: Omit<ControlsProps, "list" | "defaultList" | "onList" | "onDefault">) {
  return (
    <div className="toolbar">
      <div className="search-field">
        <Icon name="search" />
        <label className="sr-only" htmlFor="problem-search">
          Search problems
        </label>
        <input
          ref={searchRef}
          type="search"
          id="problem-search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search problems…"
          autoComplete="off"
        />
        <kbd aria-hidden="true">⌘ K</kbd>
      </div>
      <button
        className={`button filter-button${filterCount ? " has-filters" : ""}`}
        onClick={onFilters}
      >
        <Icon name="sliders" />
        Filters
        {filterCount ? (
          <span className="filter-count">{filterCount}</span>
        ) : null}
      </button>
      <button
        className="button library-view-button"
        type="button"
        onClick={onToggleView}
      >
        <Icon name={listView ? "groupedList" : "list"} />
        {listView ? "Grouped view" : "List view"}
      </button>
      <div className="select-wrap sort-select">
        <label className="sr-only" htmlFor="problem-sort">
          Sort problems
        </label>
        <select
          id="problem-sort"
          value={sort}
          onChange={(event) => onSort(event.target.value as SortOrder)}
        >
          <option value="list">Sort: List order</option>
          <option value="difficulty">Difficulty: Easy first</option>
          <option value="difficulty-desc">Difficulty: Hard first</option>
          <option value="title">Name: A–Z</option>
          <option value="title-desc">Name: Z–A</option>
          <option value="practice-desc">Most practised</option>
          <option value="practice">Least practised</option>
          <option value="recent">Last practised: Newest</option>
          <option value="oldest">Last practised: Oldest</option>
        </select>
        <Icon name="chevronDown" />
      </div>
      {listView ? null : (
        <button className="text-button expand-button" onClick={onExpandAll}>
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      )}
    </div>
  );
}

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 240);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;
  return (
    <button
      className="button library-back-to-top"
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={(event) => {
        event.currentTarget.closest("main")?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: "instant" });
      }}
    >
      <Icon name="arrowUp" />
    </button>
  );
}

export function ActiveFilters({
  filters,
  onRemove,
  onRemoveReview,
}: {
  filters: LibraryFilters;
  onRemove: (key: SelectionFilter, value: string) => void;
  onRemoveReview: () => void;
}) {
  const keys: SelectionFilter[] = [
    "difficulties",
    "statuses",
    "labels",
    "platforms",
  ];
  return (
    <div className="active-filters">
      {keys.flatMap((key) =>
        filters[key].map((value) => (
          <button
            className="filter-chip"
            key={`${key}:${value}`}
            onClick={() => onRemove(key, value)}
            aria-label={`Remove ${value} filter`}
          >
            {value}
            <Icon name="x" />
          </button>
        )),
      )}
      {filters.needsReview ? (
        <button
          className="filter-chip"
          onClick={onRemoveReview}
          aria-label="Remove Needs review filter"
        >
          <Icon name="bookmark" />
          Needs review
          <Icon name="x" />
        </button>
      ) : null}
      {filters.labels.length > 1 ? (
        <span className="match-caption">Match {filters.labelMatch} labels</span>
      ) : null}
    </div>
  );
}
