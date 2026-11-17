# Continue work on Patterna

## Start here

Read `AGENTS.md`, `docs/requirements.md` and `docs/architecture.md`. User decisions in those files are the current product requirements. Keep SOLID, KISS and YAGNI in mind; prefer small components and explicit functions.

The repository was repurposed from inherited Memora code. That obsolete Kotlin/Spring/Telegram implementation and its documentation were intentionally removed. Git history is preserved.

## Implemented

- React + strict TypeScript + Vite in `frontend/`.
- Main problem-library page with 250 seeded NeetCode tasks and overlapping NeetCode 150 and Blind 75 memberships.
- List selection, default-list star, collection progress, combined filters, search, sorting and topic accordions.
- Independent manual task status, review flags and dated practice entries; practice can be backdated or deleted.
- Light/dark theme preference; mobile-first rows and desktop table.
- Header has a theme toggle and no Needs review button. The two prototype/sample labels were removed from the interface.
- Iced Latte-inspired footer with a support link to `https://buymeacoffee.com/lucky_1uck`, reused below the task workspace as well as on the library. The demonstration caption is omitted from the question pane.
- Single-owner sign-in and PostgreSQL workspace storage. Theme and default-list preference stay in the browser.
- Standalone task routes at `/problems/<leetcode-slug>`, with NeetCode-style split panes, pointer/keyboard resizing and a mobile Problem/Solutions switch.
- Multiple solutions with separate code and Markdown thoughts, optional metadata, explicit save, editing and confirmed deletion. Saving never changes status, review flags or practice.
- Unsaved navigation warnings, draft retention on failed requests and solution version checks across sessions.
- Explicit import of legacy browser progress, practice and solutions. The import skips demo practices and preserves existing database records.
- Blue light/dark themes; the library no longer shows LC/NC abbreviations or dates below practice counts.

## Not implemented

Full source-content and additional catalogue imports remain outstanding. Concatenation of Array has a demonstration description, two custom examples and user-supplied constraints. The task page omits the Source details table, platform selector and large original-problem notice. No Apple Notes progress was imported.

## Run and verify

See the root README and backend README for startup, migration, seed and verification commands. The frontend runs on port 5173 and proxies API requests to port 8000. The local PostgreSQL container uses port 55432.

Verification covers frontend type checking, 12 frontend tests, the production build, four PostgreSQL integration tests and Alembic schema checks. Desktop and phone browser smoke tests use isolated contexts and a separate database to check sign-in, persistence across sessions, stale-write handling, import and sign-out.

## Existing source material

These Google Drive documents were inspected during planning. They are source material, not proof that their full contents have already been imported into the application:

- [Earlier project plan](https://docs.google.com/document/d/1lXV_F2cXEBYOLb-PpgtqjVVBhWB7g1W9W5fD9l_VqAU/edit)
- [NeetCode 250 catalogue](https://docs.google.com/document/d/1JQNBqISpNU0mZr2JlkU1BRmhnD8OUXQg6YmU0rDct6Y/edit)
- [AlgoExpert 200 catalogue](https://docs.google.com/document/d/1JX0wA-9BM5jMi-WvXw7xvADmCMOYmynQHKocHHxbD4E/edit)
- [LeetCode free-problem catalogue](https://docs.google.com/document/d/1HTXbWuSiH3PM7YU91USvplxo-AgariyhMQSSjahyCwY/edit)

The earlier plan contains proposals that were refined in this chat. Current repository requirements take precedence over those older proposals. The inspected catalogues mainly contain metadata/links and some original study guidance; full platform statements, constraints and hints must not be assumed present.
