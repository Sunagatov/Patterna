# Agreed requirements

Patterna is a private, single-user algorithm problem library and practice tracker.

## Main page

- Home-linked Patterna brand, header and footer adapted from Iced Latte.
- Header light/dark theme button; no header Needs review button.
- Footer Support this project button uses `https://buymeacoffee.com/lucky_1uck`.
- No Sample data label or sample-progress explanatory footer text in the product interface.
- Study-list dropdown and star selecting the list to open by default.
- Compact solved/total, difficulty and Needs review summary for the selected collection. Filtering does not alter collection progress.
- Search, combined filters, sorting, active filter chips and reset.
- OR within a selected field; AND across fields. Multiple labels support match-any or match-all.
- Topic groups can expand/collapse. Phone task rows remain usable without page-wide horizontal scrolling; desktop uses a table.

## Practice and status

- Manually selected task statuses: Not started, In progress, Unsolved, Solved.
- Needs review is independent of task status and stays set until manually changed.
- Manual practice logging increments a counter and creates a dated "practised" entry. Entries can be backdated or deleted.
- Changing a status, marking review or saving a solution never logs practice automatically.
- Progress is shared across platform versions and overlapping lists of the same canonical task.
- Apple Notes were used to understand the workflow only; do not import that historical progress.

## Planned task-detail scope

- Multiple saved solutions per task. Each solution pairs code with its own formatted thoughts.
- Code only, thoughts only, or both are allowed. An empty code-and-thoughts pair is not a solution.
- Title, language, approach labels and manually entered time/space complexity are optional.
- Editing a solution replaces its code/thoughts. No edit history for this release.
- No general task notes, category notes or separate reference notebook.
- Platform descriptions, requirements, examples, hints and other source metadata are read-only in the UI. The task page will switch between platform versions.
- No execution, judge, tests of the user's algorithm code, or submission integration.

## Current milestone

Main-page frontend with hardcoded fixtures and browser-local state. The full task-detail/editor page, login, database imports, backend, generated REST client and Alembic migrations are future implementation work. The agreed backend stack is Python, FastAPI, SQLAlchemy, PostgreSQL and Alembic.
