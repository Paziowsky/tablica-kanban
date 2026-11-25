# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Team Kanban board: a university project for the "Frameworki programowania" course. The single CRUD resource is a **Task**, with the fields `id`, `title` (at least 3 chars), `description`, `status` (`TODO`/`IN_PROGRESS`/`DONE`), `priority` (`LOW`/`MEDIUM`/`HIGH`), `assignee`, `dueDate` (`YYYY-MM-DD`) and `createdAt` (ISO 8601 UTC).

The course requires these three frameworks, so don't swap them out:
- **Next.js App Router**: UI plus REST Route Handlers in one app.
- **Bootstrap 5**: the UI framework. Don't use Tailwind.
- **Playwright**: E2E and API tests.

Data lives in SQLite through `better-sqlite3`. The code is plain JavaScript, not TypeScript. UI text is Polish (`<html lang="pl">`, column names "Do zrobienia" / "W toku" / "Zakończone"). README.md is in Polish and ROADMAP.md in English.

## Status and plan

`ROADMAP.md` is the implementation plan and the source of truth for structure and decisions. Work through it phase by phase and tick the checkboxes as items are done. Phases 0 (scaffold), 1 (data layer: `lib/db.js`, `lib/validation.js`, `lib/tasks.js`, `scripts/seed.js`), 2 (REST API in `app/api/tasks/`), 3 (board UI in `components/`), 4 (Playwright tests: `tests/api.spec.js`, `tests/validation.spec.js`, `tests/ui.spec.js`) and 5 (README with run instructions and API table, screenshots in `docs/`, CI in `.github/workflows/tests.yml`) are finished. Only the optional Extras remain.

## Commands

```bash
npm install                   # node_modules is not committed; needs Node >= 22 (better-sqlite3 13)
npm run dev                   # dev server
npm run build && npm start    # production build
npm run lint                  # ESLint (eslint-config-next core-web-vitals)
npm run db:seed               # (re)creates data/kanban.db with 8 sample tasks; honours DB_PATH
npm run test:e2e              # all Playwright tests in tests/ (builds and starts the app on :3100 first)
npx playwright test tests/validation.spec.js -g "dueDate"     # one file / one test by name
npx playwright show-report
```

## Architecture (as planned in ROADMAP.md)

- **`lib/db.js`**: a single `better-sqlite3` connection cached on `globalThis` so hot reload doesn't open new ones.
  - The path comes from `process.env.DB_PATH` (default `data/kanban.db`). Create the folder with `fs.mkdirSync(..., { recursive: true })` first, since better-sqlite3 won't.
  - The schema is created with `CREATE TABLE IF NOT EXISTS`, and its `CHECK` constraints mirror the enums.
  - Use `strftime('%Y-%m-%dT%H:%M:%SZ','now')` for `createdAt`, not `datetime('now')`.
- **`lib/tasks.js`**: the repository, using prepared statements only: `listTasks({status, priority, assignee})`, `getTask`, `createTask`, `updateTask` (full), `patchTask` (partial), `deleteTask`.
- **`lib/validation.js`**: the one place for the rules. `validateTask(input, { partial })` returns `{ valid, errors: { field: message } }` and is shared by the API (and optionally the form).
- **`app/api/tasks/route.js`** (GET list with filters, POST) and **`app/api/tasks/[id]/route.js`** (GET, PUT, PATCH, DELETE):
  - Status codes are 200 / 201 (plus a `Location` header) / 204 (no body) / 400 / 404.
  - Errors use the format `{ "error": "...", "details": { field: message } }` (built by `errorResponse` in `lib/http.js`). `details` is present for validation and filter errors.
  - Invalid JSON returns 400, and so does an id that isn't a positive integer. Unknown `status`/`priority` filter values return 400.
  - `PUT` replaces all editable fields, so fields left out reset to their defaults. `PATCH` changes only the fields sent.
  - `params` is a Promise, so use `const { id } = await params`.
- **UI**: `app/page.js` (server component: navbar) renders the client component `components/Board.js`.
  - Board owns all state: it loads every task once from `GET /api/tasks` and reloads after each change. Filters (priority, assignee) run in the browser, not through the API's query params. A filter for a person who no longer has tasks is ignored.
  - TaskCard, TaskFormModal (one form for create = `POST` and edit = `PUT`; it includes `status` so `PUT` doesn't reset it), ConfirmDelete and Filters sit next to Board. `Modal.js` is the shared Bootstrap modal markup, driven by React state with no Bootstrap JS. Polish labels, badge colours and date helpers live in `labels.js`.
  - The form uses `noValidate`. Errors come only from the server's 400 `details` and show with `is-invalid` / `invalid-feedback`.
  - A task is overdue when `dueDate` is before today's local date and its status isn't `DONE`.
  - `data-testid` hooks: `column-TODO|IN_PROGRESS|DONE`, `column-count`, `task-card` (plus `data-task-id`), `task-title`, `task-priority`, `task-assignee`, `task-due-date`, `new-task`, `filter-priority`, `filter-assignee`, `task-form`, `field-<name>`, `confirm-delete`, `error-alert`. Form inputs also have labels, so `getByLabel("Tytuł")` works.
  - Lint (`react-hooks/set-state-in-effect`) rejects an `async` function that sets state being called from `useEffect`. Use a promise chain with `setState` in the `.then`/`.catch` callbacks (see `load` in Board.js).
- **`scripts/seed.js`**: runs under plain Node, not Next.js. The `@/` alias (from `jsconfig.json`) does not resolve there, so use relative imports. Plain Node also needs `"type": "module"` in `package.json` for `import` syntax. The seed must include at least one overdue task.
- **Tests (`playwright.config.js`)**:
  - `webServer` runs `npm run build && npm run start -- -p 3100` with `reuseExistingServer: false` and `DB_PATH=data/test.db`, so tests never touch the dev server or the real DB. Every test run rebuilds the app, so expect about a minute before the first test.
  - `tests/api.spec.js` empties the board in `beforeEach` by deleting every task through the API. If a faster reset is ever needed, gate a test-only endpoint on a custom env var such as `E2E=1`, not on `NODE_ENV`, because `next start` always sets `production`.
  - `workers: 1`, since all tests share one SQLite file.
  - Projects: `api` runs `api|validation.spec.js` once without a browser; `chromium` (Desktop Chrome) and `mobile` (Pixel 7, also Chromium) run `ui.spec.js`. Only Chromium is needed: `npx playwright install chromium`. Run one project with `--project=chromium`.
  - `tests/ui.spec.js` sets up data through the API and checks behaviour through the UI. Look form fields up inside the form (`form(page).getByLabel(...)`): `getByLabel` matches substrings, so on the whole page "Priorytet" also hits the filter "Filtruj według priorytetu".
  - To send a raw body (for example invalid JSON), pass a `Buffer`. A string in `data` gets JSON-encoded.

## Gotchas

- `next.config.mjs` enables `cacheComponents`, which removes the `dynamic`, `revalidate`, `fetchCache` and `runtime` segment configs. Don't add them. Under Cache Components a `GET` handler or page that touches no request data is **prerendered at build time**, and synchronous `better-sqlite3` reads don't count as request data. Any `GET` that reads the database must read the request (query string, `params`, headers) or call `await connection()` from `next/server`. After `npm run build`, check that such routes show as `ƒ (Dynamic)`, not `○ (Static)`. The Next.js docs for this exact version are in `node_modules/next/dist/docs/`.
- Next.js is 16.x and React 19.x, so check current APIs rather than relying on older Next.js patterns.
- `*.db`, `*.db-wal` and `*.db-shm` are gitignored. Don't commit database files.
- On Windows without the Visual Studio C++ toolset, `npm ci` fails in `better-sqlite3`: npm's implicit `node-gyp rebuild` looks for Visual Studio before noticing the bundled prebuild. `npm ci --ignore-scripts` works, and the bundled `prebuilds/win32-x64.node` is used.
