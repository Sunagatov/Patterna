# Frontend

Read the repository `AGENTS.md` and `docs/requirements.md`.

- `src/app/` owns the app shell, header, footer, theme and global styles.
- `src/features/library/` owns library types, pure filtering/sorting/progress functions, legacy storage readers, the state hook and library components.
- `src/features/problem/` owns the split task-detail workspace, solution editing, code and thoughts editors, and source metadata display. `src/app/usePageRoute.ts` owns History API navigation and unsaved-change guards.
- `src/api/` owns generated transport types, the typed API client and the explicit browser-data import.
- `src/shared/ui/` contains only genuinely shared visual primitives.
- Keep `App` and `LibraryPage` as composition components. Avoid monolithic components and unnecessary state libraries.
- Calculate filtered results and summary counts from current state; do not synchronize derived state with effects.
- The legacy fixture is the original sample baseline for browser-data import.
- Preserve independent status/review/practice actions and shared task identity across lists.
- Keep theme and default-list preferences browser-local. Only read legacy progress and solutions for explicit import.
- Send the saved solution version with edits and deletes. Keep drafts on request failures and version conflicts.
- Render thoughts as escaped React elements, never raw HTML. Saving code/thoughts must not log practice or set task status.
- Test meaningful behaviour, not markup snapshots or implementation details.

Commands: `npm run check`, `npm test`, `npm run build`, `npm run dev`.
