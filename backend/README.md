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

## Import question details

Question details come from a private JSON snapshot of the Google Docs catalogue. It contains the native document URL and revision plus a list of source records. Each record identifies the existing LeetCode slug, platform, source URL, verification status, optional numeric platform ID, and the question data and provenance for that platform. A blocked source carries its provenance and a null question.

Apply migrations and seed the catalogue before importing. Check the snapshot before writing it.

```sh
uv run python -m patterna.import_details --check /path/to/catalogue-details.json
uv run python -m patterna.import_details /path/to/catalogue-details.json
```

The importer validates the source links against the seeded slugs. It updates question records by problem and platform in one transaction. Keep the snapshot outside Git. The authenticated question endpoint prefers the NeetCode record.

## Import additional study plans

LeetCode 75, Top 100 Liked and Top Interview 150 use a private Google Docs snapshot. Each plan records its list ID, document URL, document revision and problem records with LeetCode slug, number, title, difficulty, category, tags, question details and verification status. Preview and merge the snapshot after seeding the base catalogue.

```sh
uv run python -m patterna.import_study_plans --check /path/to/study-plans.json
uv run python -m patterna.import_study_plans /path/to/study-plans.json
```

The merge reuses existing problem IDs and adds list memberships without changing practice history, status, review flags or solutions. It adds missing LeetCode details and upgrades lower-verification versions. Keep the snapshot outside Git. Repeating the same import produces zero changes.

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
