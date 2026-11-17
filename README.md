# Patterna

A personal algorithm problem library and practice tracker for LeetCode, NeetCode and AlgoExpert.

## Current implementation

The library has list selection, collection progress, search, combined filters, sorting, topic accordions, manual practice history, independent task statuses and review flags. Light/dark theme and default-list preferences stay in the browser.

Task titles open a split workspace at `/problems/<leetcode-slug>`, with resizable desktop panes, a mobile Problem/Solutions switch, multiple saved code solutions and per-solution Markdown thoughts. The question pane loads descriptions, examples and constraints from the imported catalogue. A fresh local database has a Concatenation of Array demonstration until question details are imported.

A single owner password protects the catalogue and workspace. FastAPI stores statuses, review flags, dated practice and solutions in PostgreSQL. A new database starts with an empty practice history. In a browser that has previous Patterna saves, **Import previous browser data** imports saved solutions, manual practice entries and progress values that differ from the original demo. Existing server records take precedence.

## Layout

```text
frontend/  React + TypeScript + Vite
backend/   FastAPI + SQLAlchemy + PostgreSQL + Alembic
docs/      Requirements and implementation boundaries
```

## Run

Start the database and API using the [backend setup instructions](backend/README.md). In a separate terminal, use Node.js 22.12+ to start the frontend.

```sh
cd frontend
npm ci
npm run dev
```

Open `http://127.0.0.1:5173` and sign in with the owner password. For old browser saves, open the same address you used previously, such as `http://localhost:5173`. Both hosts resolve to the local app, but use separate browser storage.

```sh
npm run check
npm test
npm run build
```

Production frontend assets are written to `frontend/dist/`.

See `docs/requirements.md` and `docs/architecture.md` for the current scope and API boundary.

For a new chat or contributor, start with [the handoff](docs/handoff.md).
