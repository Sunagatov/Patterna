# Current architecture

One Git repository, with `frontend/` and `backend/` boundaries.

## Frontend

React + strict TypeScript + Vite. Runtime dependencies are React and React DOM; no state, query or routing library is needed for the current single-page scope.

- `src/app/`: composition, header/footer, theme and stylesheet.
- `src/features/library/types.ts`: UI domain types, statuses, lists and filters.
- `src/features/library/data/fixtures.ts`: hardcoded catalogue and illustrative progress.
- `src/features/library/library.ts`: pure query, ordering, date and progress functions.
- `src/features/library/storage.ts`: validated browser-local progress and preferences.
- `src/features/library/useLibrary.ts`: small React state hook; independent update operations.
- `src/features/library/components/`: single-purpose controls, rows, summaries and dialogs.
- `src/shared/ui/`: static icon and accessible native-dialog primitives.

Filtered results and summary counts are derived from state. No duplicate summary state, dependency injection, service layer or fake network requests.

Browser persistence stores progress and preferences, not credentials. Hardcoded progress is illustrative and is not imported from Apple Notes.

## Future backend boundary

FastAPI will define request/response schemas and expose OpenAPI. Generate TypeScript transport types and the API client from that schema, with checks for generated-code drift and behaviour tests for API semantics. Current UI domain types are not a completed transport contract.

PostgreSQL schema changes will use reviewed Alembic migrations. Platform-specific source content and shared canonical-task progress will remain distinct. Backend and authentication are not implemented in this milestone.

## Catalogue provenance

Metadata comes from the saved Patterna NeetCode 250 catalogue. NeetCode 150 and Blind 75 memberships were matched using NeetCode's maintained public metadata. Counts are 250, 150 and 75 unique canonical tasks respectively. This fixture does not yet contain the AlgoExpert or full LeetCode catalogue.
