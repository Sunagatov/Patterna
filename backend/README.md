# Patterna backend

FastAPI serves the private workspace from PostgreSQL using SQLAlchemy. Alembic manages the schema. The catalogue seed adds the 250 canonical problem IDs and their study-list memberships.

## Local setup

Run from `backend/` with Docker, Docker Compose and uv available. The setup script prompts for the owner password and creates the ignored `.env` file.

```sh
uv sync
uv run python setup_local.py
docker compose -p patterna-dev up -d --wait
uv run alembic upgrade head
uv run python -m patterna.seed
uv run uvicorn patterna.main:app --host 127.0.0.1 --port 8000 --reload
```

The database uses localhost port 55432 and a named Docker volume. Rerun migrations when pulling schema changes. The seed can be run again without replacing existing catalogue rows or owner data.

A deployment should route the frontend and `/api` through the same HTTPS origin and leave secure cookies enabled. Set `PATTERNA_DATABASE_URL` and `PATTERNA_PASSWORD_HASH` in the runtime environment using the format in `.env.example`. The login attempt limit is process-local, so run a single API worker or enforce a shared limit at deployment.

## Verification

Set `PATTERNA_TEST_DATABASE_URL` to a PostgreSQL URL whose role can create schemas, then run these commands from `backend/`. The API tests create and remove isolated schemas.

```sh
uv run ruff check .
uv run pytest
uv run alembic check
```

After changing the API, regenerate both checked-in contracts from `backend/`.

```sh
uv run python export_openapi.py
npm --prefix ../frontend exec --yes --package=typescript@5.9.3 --package=openapi-typescript@7.13.0 -- openapi-typescript openapi.json -o ../frontend/src/api/schema.d.ts
```
