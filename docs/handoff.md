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

## Not implemented

The full task-detail/solution editor, password authentication, FastAPI backend, PostgreSQL database, Alembic migrations, catalogue imports and generated OpenAPI frontend client are still outstanding. `backend/` is reserved for the agreed Python stack. The small problem-preview dialog is not the full task-detail page.

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

Before this handoff, strict type checking, all six behaviour tests, formatting, the production build and browser QA passed. Browser checks included light/dark themes, 320px/390px mobile and 1280px desktop widths, search/combined filters, sorting, default-list persistence, independent progress actions and backdated-practice corrections. No application console warnings/errors were observed. Browser QA screenshots and the earlier standalone HTML prototype are outside this repository and are not required to run it.

## Existing source material

These Google Drive documents were inspected during planning. They are source material, not proof that their full contents have already been imported into the application:

- [Earlier project plan](https://docs.google.com/document/d/1lXV_F2cXEBYOLb-PpgtqjVVBhWB7g1W9W5fD9l_VqAU/edit)
- [NeetCode 250 catalogue](https://docs.google.com/document/d/1JQNBqISpNU0mZr2JlkU1BRmhnD8OUXQg6YmU0rDct6Y/edit)
- [AlgoExpert 200 catalogue](https://docs.google.com/document/d/1JX0wA-9BM5jMi-WvXw7xvADmCMOYmynQHKocHHxbD4E/edit)
- [LeetCode free-problem catalogue](https://docs.google.com/document/d/1HTXbWuSiH3PM7YU91USvplxo-AgariyhMQSSjahyCwY/edit)

The earlier plan contains proposals that were refined in this chat. Current repository requirements take precedence over those older proposals. The inspected catalogues mainly contain metadata/links and some original study guidance; full platform statements, constraints and hints must not be assumed present.
