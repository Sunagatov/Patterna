# Current architecture

One Git repository, with `frontend/` and `backend/` boundaries.

## Frontend

React, strict TypeScript and Vite. The OpenAPI-derived types and `openapi-fetch` client live in `src/api/`.

- `src/app/` owns sign-in, the workspace load, layout, theme and guarded History API navigation. The library stays mounted while a task is open so filters survive returning to it.
- `src/features/library/` owns ordering, filtering, progress and practice controls.
- `src/features/problem/` owns the split task workspace, solution editor and safe Markdown renderer.
- `src/shared/ui/` owns icons and accessible native-dialog components.

The frontend derives filtered results and summary counts from the server workspace. Theme and default-list preferences stay in browser storage. The explicit import reads legacy library and solution keys, compares progress to the original fixture and excludes seeded practice history.

Task routes use `/problems/<leetcode-slug>` and must receive the SPA entry point on direct requests. Vite supplies that fallback and proxies `/api` to the local API. Hosting must preserve the fallback and serve `/api` on the same origin.

The editor reports a save after the database commits. Request failures retain the draft. Thoughts render as React text and elements with support for headings, paragraphs, lists, emphasis and code.

## Backend

FastAPI defines request and response schemas. Commit the exported OpenAPI contract and regenerate TypeScript types using the commands in `backend/README.md`.

PostgreSQL stores canonical problems, status and review flags, individual practice entries and versioned solutions. Practice and solution writes use stable IDs. Solution updates and deletions require the version last read by the client. Browser imports commit atomically, use a receipt for idempotency and preserve existing server records. Alembic manages schema changes.

The owner password is verified with Argon2. An HttpOnly, SameSite=Strict cookie carries a random session token, and PostgreSQL stores only its digest and expiry. Sign-out revokes the session. Browser writes also require an application request header.

## Catalogue provenance

Metadata comes from the saved Patterna NeetCode 250 catalogue. NeetCode 150 and Blind 75 memberships were matched using NeetCode's maintained public metadata. Counts are 250, 150 and 75 unique canonical tasks respectively. This fixture does not yet contain the AlgoExpert or full LeetCode catalogue.
