import { useState } from "react";
import { Dialog } from "../../../shared/ui/Dialog";
import { Icon } from "../../../shared/ui/Icon";
import { emptyFilters, taskStatuses } from "../types";
import type { Difficulty, LibraryFilters, Platform } from "../types";

function CheckboxGroup<T extends string>({
  title,
  values,
  selected,
  onChange,
  className = "filter-options",
}: {
  title: string;
  values: readonly T[];
  selected: T[];
  onChange: (values: T[]) => void;
  className?: string;
}) {
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className={className}>
        {values.map((value) => (
          <label
            className={`check-option ${value.toLowerCase().replace(" ", "-")}`}
            key={value}
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() =>
                onChange(
                  selected.includes(value)
                    ? selected.filter((item) => item !== value)
                    : [...selected, value],
                )
              }
            />
            {value}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FilterDialog({
  filters,
  labels,
  onApply,
  onClose,
}: {
  filters: LibraryFilters;
  labels: string[];
  onApply: (filters: LibraryFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);
  const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];
  const platforms: Platform[] = ["LeetCode", "NeetCode", "AlgoExpert"];

  return (
    <Dialog
      title="Filter problems"
      subtitle="Find exactly what you want to practise."
      onClose={onClose}
      className="filter-dialog"
    >
      <form
        className="filter-form"
        onSubmit={(event) => {
          event.preventDefault();
          onApply(draft);
        }}
      >
        <div className="filter-body">
          <CheckboxGroup
            title="Difficulty"
            values={difficulties}
            selected={draft.difficulties}
            onChange={(values) => setDraft({ ...draft, difficulties: values })}
          />
          <CheckboxGroup
            title="Status"
            values={taskStatuses}
            selected={draft.statuses}
            className="filter-options status-options"
            onChange={(values) => setDraft({ ...draft, statuses: values })}
          />
          <fieldset>
            <legend>Topics & approaches</legend>
            <label className="sr-only" htmlFor="label-match">
              How to match selected labels
            </label>
            <select
              id="label-match"
              value={draft.labelMatch}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  labelMatch: event.target.value as "any" | "all",
                })
              }
            >
              <option value="any">Match any selected label</option>
              <option value="all">Match all selected labels</option>
            </select>
            <div className="topic-filter-options">
              {labels.map((label) => (
                <label key={label}>
                  <input
                    type="checkbox"
                    checked={draft.labels.includes(label)}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        labels: draft.labels.includes(label)
                          ? draft.labels.filter((value) => value !== label)
                          : [...draft.labels, label],
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <CheckboxGroup
            title="Platform"
            values={platforms}
            selected={draft.platforms}
            onChange={(values) => setDraft({ ...draft, platforms: values })}
          />
          <label className="review-option">
            <Icon name="bookmark" />
            <span>Only tasks needing review</span>
            <input
              type="checkbox"
              checked={draft.needsReview}
              onChange={(event) =>
                setDraft({ ...draft, needsReview: event.target.checked })
              }
            />
          </label>
        </div>
        <div className="dialog-footer">
          <button
            type="button"
            className="text-button"
            onClick={() => setDraft(emptyFilters())}
          >
            Reset filters
          </button>
          <button type="submit" className="button button-primary">
            Apply filters <Icon name="arrowRight" />
          </button>
        </div>
      </form>
    </Dialog>
  );
}
