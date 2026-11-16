# Frontend

Read the repository `AGENTS.md` and `docs/requirements.md`.

- `src/app/` owns the app shell, header, footer, theme and global styles.
- `src/features/library/` owns catalogue fixtures, library types, pure filtering/sorting/progress functions, local storage, the state hook and library components.
- `src/shared/ui/` contains only genuinely shared visual primitives.
- Keep `App` and `LibraryPage` as composition components. Avoid monolithic components and unnecessary state libraries.
- Calculate filtered results and summary counts from current state; do not synchronize derived state with effects.
- Hardcoded fixtures are temporary input data, not a backend transport contract.
- Preserve independent status/review/practice actions and shared task identity across lists.
- Update browser-local storage keys/validation if their shape changes.
- Test meaningful behaviour, not markup snapshots or implementation details.

Commands: `npm run check`, `npm test`, `npm run build`, `npm run dev`.
