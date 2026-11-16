# Agreed requirements

Patterna is a private, single-user algorithm problem library and practice tracker.

## Main page

- Home-linked Patterna brand, header and footer adapted from Iced Latte.
- The Patterna logo is the library/home link. Omit the redundant Problems link in the main header, the Problem library back link and previous/next problem arrows in the task header.
- Task badges show difficulty, category and study-list memberships together beneath the title (e.g. Easy · Arrays & Hashing · NeetCode 250). Do not repeat Topics & patterns or Study lists as lower sections.
- Header light/dark theme button; no header Needs review button.
- Footer Support this project button uses `https://buymeacoffee.com/lucky_1uck`.
- Reuse the site footer on task pages below the full-height workspace. Back to top scrolls without discarding an unsaved solution. Do not show the “Patterna demonstration description and examples.” caption in the question pane.
- No Sample data label or sample-progress explanatory footer text in the product interface.
- Study-list dropdown and star selecting the list to open by default.
- Compact solved/total, difficulty and Needs review summary for the selected collection. Filtering does not alter collection progress.
- Search, combined filters, sorting, active filter chips and reset.
- OR within a selected field; AND across fields. Multiple labels support match-any or match-all.
- Topic groups can expand/collapse. Phone task rows remain usable without page-wide horizontal scrolling; desktop uses a table.

## Practice and status

- Manually selected task statuses: Not started, In progress, Unsolved, Solved.
- Needs review is independent of task status and stays set until manually changed.
- Manual practice logging increments a counter and creates a dated "practised" entry. Entries can be backdated or deleted.
- Changing a status, marking review or saving a solution never logs practice automatically.
- Progress is shared across platform versions and overlapping lists of the same canonical task.
- Apple Notes were used to understand the workflow only; do not import that historical progress.

## Task-detail scope

- Multiple saved solutions per task. Each solution pairs code with its own formatted thoughts.
- Code only, thoughts only, or both are allowed. An empty code-and-thoughts pair is not a solution.
- Title, language, approach labels and manually entered time/space complexity are optional.
- Editing a solution replaces its code/thoughts. No edit history for this release.
- No general task notes, category notes or separate reference notebook.
- Platform descriptions, requirements, examples, hints and other source metadata are read-only in the UI. The task page will switch between platform versions.
- No execution, judge, tests of the user's algorithm code, or submission integration.

## Current milestone

The library and task-detail frontend use hardcoded catalogue metadata and browser-local progress/solutions. Task titles open `/problems/<leetcode-slug>`. The task page follows the NeetCode-style split workspace: read-only question/source information on the left, separate solution tabs and code editor on the right, and per-solution thoughts below. Desktop panes resize with pointer or keyboard; mobile switches between Problem and Solutions. Both themes retain the blue palette.

Solutions accept code, Markdown thoughts or both. Optional title, language, approach and complexity fields are available under Details. Saving is explicit; navigation warns about unsaved edits. Editing replaces the selected solution while retaining its creation date. Deleting a solution requires confirmation. Storage failures retain the current draft; unreadable saved records and conflicting writes from another tab cannot be overwritten silently.

The current catalogue provides metadata and source slugs only. Full statements, examples, constraints, hints and diagrams have not been imported. No AlgoExpert equivalence is invented.

For the task-description layout demonstration, Concatenation of Array alone has original Patterna wording, two custom examples, functional requirements and the user-supplied constraints (`n == nums.length`, `1 <= n <= 1000`, `1 <= nums[i] <= 1000`) below its difficulty/category badges. This is not an automated platform import. Other tasks are unchanged; do not expand this demonstration across the catalogue without a further request.

The question pane follows the NeetCode-style reading layout: title and badges, description, examples, requirements and constraints. The later user instruction supersedes the earlier Platforms-row design: remove the entire Source details table, including platform controls, source slug, duplicate difficulty and unavailable-content rows. Do not show separate platform tabs or a large “Read the original problem” section. The editor save bar shows actions and save/error feedback, without static explanatory or keyboard-helper text.

Login, source-content imports, backend, generated REST client and Alembic migrations remain future work. The agreed backend stack is Python, FastAPI, SQLAlchemy, PostgreSQL and Alembic.
