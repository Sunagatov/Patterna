# Patterna

A personal algorithm problem library and practice tracker for LeetCode, NeetCode and AlgoExpert.

## Current implementation

The main page is a working React/TypeScript frontend with hardcoded task metadata and illustrative progress. It has list selection, a default-list star, collection progress, search, combined filters, sorting, topic accordions, manual practice history, independent task statuses and review flags. Light/dark themes and local preferences persist in the current browser.

No Apple Notes progress is imported. There is no login, backend, database connection, code execution or solution judging in this frontend milestone.

## Layout

```text
frontend/  React + TypeScript + Vite
backend/   Reserved for the future FastAPI application
docs/      Requirements and implementation boundaries
```

## Run

Use a Node.js version supported by Vite (22.12+ or a newer supported release).

```sh
cd frontend
npm ci
npm run dev
```

Vite serves the application at `http://127.0.0.1:5173`.

```sh
npm run check
npm test
npm run build
```

Production frontend assets are written to `frontend/dist/`.

See `docs/requirements.md` and `docs/architecture.md` for the current scope and planned API boundary.

For a new chat or contributor, start with [the handoff](docs/handoff.md).
