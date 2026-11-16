# Patterna

Private, single-user algorithm practice tracker. Read `docs/requirements.md` for agreed product behaviour.

## Repository boundaries

- `frontend/`: React, TypeScript, Vite application. Currently uses hardcoded fixtures and browser-local progress.
- `backend/`: reserved for Python/FastAPI, SQLAlchemy, PostgreSQL and Alembic. Not implemented yet.
- `docs/`: current project requirements and architecture; do not restore inherited Memora content.

## Working rules

- Keep code simple and feature-oriented. Prefer small components and explicit functions.
- Apply SOLID where it improves responsibilities; do not add interfaces, factories, services, stores or dependencies for hypothetical needs.
- Preserve manual status changes, manual practice logging, and independent review flags.
- No code execution, compiler, judge or submission feature.
- Code solutions and their attached rich thoughts are planned task-detail features. Do not introduce general task or category notes.
- Imported source content is read-only in the UI.
- Never store credentials or authentication tokens in browser storage.
- The current frontend is not authenticated or backend-connected. Do not describe mock storage as an API or a completed REST contract.
- When a backend exists, generate frontend API types/client from its OpenAPI schema; do not hand-maintain duplicate transport types.
- Mobile-first layouts must also work on desktop. Verify both themes, touch controls, keyboard use and overflow.
- All schema changes in the future backend need reviewed Alembic migrations.
- Run `cd frontend && npm run check && npm test && npm run build` for application changes, and browser-check changed user flows.
