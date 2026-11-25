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

`ROADMAP.md` is the implementation plan and the source of truth for structure and decisions. Work through it phase by phase and tick the checkboxes as items are done. Only Phase 0 (scaffold) is finished: `app/page.js` is a placeholder, and `lib/`, `scripts/`, `app/api/`, `components/` and `playwright.config.js` don't exist yet. When you create them, follow the file layout the roadmap suggests.

## Commands

```bash
npm install                   # node_modules is not committed; needs Node >= 20.9
npm run dev                   # dev server
npm run build && npm start    # production build
npm run lint                  # ESLint (eslint-config-next core-web-vitals)
npm run db:seed               # runs scripts/seed.js (not written yet, Phase 1)
npm run test:e2e              # Playwright (no config or tests yet, Phase 4)
npx playwright test tests/tasks.spec.js -g "creates a task"   # a single test, once tests exist
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
  - Errors use the format `{ "error": "Validation failed", "details": { "title": "..." } }`.
  - Invalid JSON returns 400, and so does a non-numeric id.
  - `params` is a Promise, so use `const { id } = await params`.
  - better-sqlite3 needs the Node.js runtime, not Edge.
- **UI**: a client page fetches `/api/tasks`.
  - Components: Board (3 columns, `col-12 col-md-4`), TaskCard, TaskFormModal (the same form for create and edit), Filters, ConfirmDelete.
  - Modals are driven by React state. If you need Bootstrap JS, load it inside `useEffect` with `import('bootstrap/dist/js/bootstrap.bundle.min.js')`.
  - Show server 400 `details` per field with `is-invalid` / `invalid-feedback`.
  - Put `data-testid` on columns, cards and form fields for Playwright.
- **`scripts/seed.js`**: runs under plain Node, not Next.js. The `@/` alias (from `jsconfig.json`) does not resolve there, so use relative imports. Plain Node also needs `"type": "module"` in `package.json` for `import` syntax. The seed must include at least one overdue task.
- **Tests (`playwright.config.js`)**:
  - `webServer` runs `npm run build && npm run start -- -p 3100` with `reuseExistingServer: false` and env `DB_PATH=data/test.db`, `E2E=1`, so tests never touch the dev server or the real DB.
  - Reset data through a test-only endpoint gated on `process.env.E2E === '1'`. Don't gate it on `NODE_ENV`, because `next start` always sets `production`.
  - Use `workers: 1`, since all tests share one SQLite file.

## Gotchas

- `next.config.mjs` enables `cacheComponents`. In Next.js 16 this conflicts with route segment config such as `export const dynamic = 'force-dynamic'`, which ROADMAP.md Phase 2 suggests. Check the Next.js 16 docs before adding segment config. Also make sure the task data is never cached or prerendered.
- Next.js is 16.x and React 19.x, so check current APIs rather than relying on older Next.js patterns.
- `*.db`, `*.db-wal` and `*.db-shm` are gitignored. Don't commit database files.
