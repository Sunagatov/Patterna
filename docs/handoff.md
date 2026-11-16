# Continue work on Patterna

## Start here

Read `AGENTS.md`, `docs/requirements.md` and `docs/architecture.md`. User decisions in those files are the current product requirements. Keep SOLID, KISS and YAGNI in mind; prefer small components and explicit functions.

The repository was repurposed from inherited Memora code. That obsolete Kotlin/Spring/Telegram implementation and its documentation were intentionally removed. Git history is preserved.

## Implemented

- React + strict TypeScript + Vite in `frontend/`.
- Main problem-library page with 250 hardcoded NeetCode tasks, overlapping NeetCode 150/Blind 75 memberships and illustrative progress.
- List selection, default-list star, collection progress, combined filters, search, sorting and topic accordions.
- Independent manual task status, review flags and dated practice entries; practice can be backdated or deleted.
- Light/dark theme preference; mobile-first rows and desktop table.
- Header has a theme toggle and no Needs review button. The two prototype/sample labels were removed from the interface.
- Iced Latte-inspired footer with a support link to `https://buymeacoffee.com/lucky_1uck`.
- Browser-local progress/preferences, with no credentials stored there.
- Standalone task routes at `/problems/<leetcode-slug>`, with NeetCode-style split panes, pointer/keyboard resizing and a mobile Problem/Solutions switch.
- Multiple browser-local solutions with separate code and Markdown thoughts, optional metadata, explicit save, editing and confirmed deletion. Saving never changes status/review/practice.
- Refresh persistence, unsaved navigation warnings, readable storage errors, corrupt-data protection and cross-tab conflict protection for solutions.
- Blue light/dark themes; the library no longer shows LC/NC abbreviations or dates below practice counts.

## Not implemented

Password authentication, FastAPI backend, PostgreSQL database, Alembic migrations, source-content imports and generated OpenAPI frontend client are still outstanding. `backend/` is reserved for the agreed Python stack. The old preview dialog has been replaced by a standalone task page. Concatenation of Array alone has a demonstration description, two custom examples and user-supplied constraints. The later user instruction removes the entire Source details table and platform selector; do not restore placeholder rows, duplicated ratings or the large original-problem notice.

No Apple Notes progress was imported. The fixture progress is not the user's real history. Lexora is only a reference for the future password-based authorization approach, not Patterna's foundation.

No next implementation task has been selected; ask what the user wants to work on next rather than treating the outstanding list as an ordered implementation plan.

## Run and verify

```sh
cd frontend
npm ci
npm run dev
```

The frontend uses `http://127.0.0.1:5173/`.

```sh
npm run check
npm test
npm run build
```

Current validation includes strict type checking, 12 behaviour tests and the production build. Task-page browser QA covers light/dark desktop, 320px/390px mobile, multiple independent solutions, code-only and thoughts-only saves, Markdown safety, refresh persistence, edit/delete, removal of the source metadata table, manual practice/status/review independence, in-session library filters, unsaved navigation including browser Back, quota failures, corrupt storage and cross-tab write conflicts. No application console warnings/errors were observed. QA uses isolated browser contexts; no personal solution or practice data is imported by these checks.

## Existing source material

These Google Drive documents were inspected during planning. They are source material, not proof that their full contents have already been imported into the application:

- [Earlier project plan](https://docs.google.com/document/d/1lXV_F2cXEBYOLb-PpgtqjVVBhWB7g1W9W5fD9l_VqAU/edit)
- [NeetCode 250 catalogue](https://docs.google.com/document/d/1JQNBqISpNU0mZr2JlkU1BRmhnD8OUXQg6YmU0rDct6Y/edit)
- [AlgoExpert 200 catalogue](https://docs.google.com/document/d/1JX0wA-9BM5jMi-WvXw7xvADmCMOYmynQHKocHHxbD4E/edit)
- [LeetCode free-problem catalogue](https://docs.google.com/document/d/1HTXbWuSiH3PM7YU91USvplxo-AgariyhMQSSjahyCwY/edit)

The earlier plan contains proposals that were refined in this chat. Current repository requirements take precedence over those older proposals. The inspected catalogues mainly contain metadata/links and some original study guidance; full platform statements, constraints and hints must not be assumed present.
