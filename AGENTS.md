# Patterna

Private, single-user algorithm practice tracker. Read `docs/requirements.md` for agreed product behaviour.

## Repository boundaries

- `frontend/`: React, TypeScript and Vite application, with a typed same-origin API client.
- `backend/`: Python/FastAPI, SQLAlchemy, PostgreSQL and Alembic.
- `docs/`: current project requirements and architecture; do not restore inherited Memora content.

## Working rules

- Keep code simple and feature-oriented. Prefer small components and explicit functions.
- Apply SOLID where it improves responsibilities; do not add interfaces, factories, services, stores or dependencies for hypothetical needs.
- Preserve manual status changes, manual practice logging, and independent review flags.
- No code execution, compiler, judge or submission feature.
- Task detail supports multiple saved code solutions with attached Markdown thoughts. Do not introduce general task or category notes.
- Imported source content is read-only in the UI.
- Never store credentials or authentication tokens in browser storage.
- Generate frontend API types from the FastAPI OpenAPI schema and use the typed client. Keep the historical frontend fixtures available for browser-data import.
- Mobile-first layouts must also work on desktop. Verify both themes, touch controls, keyboard use and overflow.
- All database schema changes need reviewed Alembic migrations. Run the PostgreSQL API tests for backend changes.
- Run `cd frontend && npm run check && npm test && npm run build` for application changes, and browser-check changed user flows.
