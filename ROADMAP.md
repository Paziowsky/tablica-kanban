# Roadmap – Team Kanban Board

Implementation plan for the project described in `README.md`
(Next.js App Router + Bootstrap 5 + SQLite/`better-sqlite3` + Playwright).

Each phase ends with a **checkpoint**: something you can run or show before moving on.

---

## Phase 0 – Project setup ✅ done

- [x] Use Node.js 20+ (develop on the current LTS, 22 or 24) – recent Next.js versions no longer support Node 18
- [x] Scaffold the app: `npx create-next-app@latest .` (App Router, ESLint; JS or TS – pick one and stick to it)
  - `create-next-app` refuses to run in a folder that contains `README.md` – move it out temporarily,
    scaffold, then put it back (replacing the generated one)
  - answer **No** to Tailwind CSS (Bootstrap is the UI framework)
- [x] Install dependencies:
  - `npm i bootstrap better-sqlite3`
  - `npm i -D @playwright/test` + `npx playwright install`
- [x] Import Bootstrap CSS once in `app/layout.js` (`import 'bootstrap/dist/css/bootstrap.min.css'`)
- [x] `.gitignore`: `node_modules`, `.next`, `*.db`, `*.db-wal`, `*.db-shm`, `test-results`, `playwright-report`
- [x] Add `engines: { "node": ">=20" }` to `package.json`
- [x] Add npm scripts: `dev`, `build`, `start`, `test:e2e`, `db:seed`

**Checkpoint:** `npm run dev` shows the default page styled with Bootstrap.

---

## Phase 1 – Data layer (SQLite) ✅ done

Suggested structure:

```
lib/
  db.js          # connection + schema creation
  tasks.js       # repository: list/get/create/update/delete
  validation.js  # validateTask(input, { partial })
scripts/
  seed.js        # sample tasks
```

- [x] `lib/db.js` – open the DB at the path from `process.env.DB_PATH` (default `data/kanban.db`), keep a single
      connection (cache it on `globalThis` so hot reload doesn't open new ones). `better-sqlite3` does not create
      missing folders, so first call `fs.mkdirSync(path.dirname(dbPath), { recursive: true })`.
      Then run `CREATE TABLE IF NOT EXISTS`:

  ```sql
  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL CHECK (length(title) >= 3),
    description TEXT DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'TODO'   CHECK (status   IN ('TODO','IN_PROGRESS','DONE')),
    priority    TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH')),
    assignee    TEXT,
    dueDate     TEXT,               -- ISO date YYYY-MM-DD
    createdAt   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))  -- ISO 8601 UTC
  );
  ```

  (`datetime('now')` would give `2026-11-25 10:00:00`, which browsers parse inconsistently.)

- [x] `lib/tasks.js` – functions using prepared statements:
  `listTasks({ status, priority, assignee })`, `getTask(id)`, `createTask(data)`,
  `updateTask(id, data)` (full), `patchTask(id, partial)`, `deleteTask(id)`
- [x] `lib/validation.js` – one place for the rules, shared by the API (and optionally the form):
  - `title` required, string, trimmed length ≥ 3 (and a max, e.g. 120)
  - `status` / `priority` in their enums
  - `dueDate` valid `YYYY-MM-DD` (optionally not earlier than today on create – if you add this rule,
    overdue tasks can only come from the seed or from edits, so decide it deliberately)
  - `assignee` optional string / email
  - returns `{ valid, errors: { field: message } }`
- [x] `scripts/seed.js` – insert ~8 example tasks across all statuses, including at least one overdue task
      (so the red "overdue" highlight can be shown and tested)
  - the script runs under plain Node, not Next.js: the `@/` path alias won't resolve there, so use relative
    imports, and either add `"type": "module"` to `package.json` (for `import` syntax) or run it with `tsx`
    (needed anyway if you chose TypeScript)

**Checkpoint:** `npm run db:seed` creates the DB file with data.

---

## Phase 2 – REST API (Route Handlers) ✅ done

Files:

```
app/api/tasks/route.js        # GET (list), POST (create)
app/api/tasks/[id]/route.js   # GET, PUT, PATCH, DELETE
```

~~Add `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'`.~~ Not allowed here:
`next.config.mjs` enables `cacheComponents`, which removes both options (Node.js is already the default runtime).
Instead, each `GET` handler reads the request (query string or `params`), so it runs per request rather than
being prerendered at build time – the build output must show both routes as `ƒ (Dynamic)`.

| Method | URL | Success | Errors |
| :-- | :-- | :-- | :-- |
| GET | `/api/tasks?status=&priority=&assignee=` | `200` + array | `400` invalid filter value |
| POST | `/api/tasks` | `201` + created task (+ `Location` header) | `400` validation |
| GET | `/api/tasks/:id` | `200` + task | `400` bad id, `404` |
| PUT | `/api/tasks/:id` | `200` + updated task | `400`, `404` |
| PATCH | `/api/tasks/:id` (e.g. `{ "status": "DONE" }`) | `200` + updated task | `400`, `404` |
| DELETE | `/api/tasks/:id` | `204` (no body) | `404` |

- [x] Consistent error format: `{ "error": "Validation failed", "details": { "title": "..." } }`
- [x] Handle invalid JSON body → `400`
- [x] Non-numeric `id` → `400`
- [x] Note: since Next.js 15 `params` is a Promise, and in current versions it must be awaited
      (synchronous access no longer works) – `const { id } = await params`

**Checkpoint:** every endpoint checked manually with curl / Thunder Client / Postman.

---

## Phase 3 – User interface (Bootstrap 5) ✅ done

Suggested components:

```
app/page.js                 # board page (client part fetches /api/tasks)
components/Board.js         # 3 columns: Do zrobienia / W toku / Zakończone
components/TaskCard.js      # title, priority badge, assignee, due date, actions
components/TaskFormModal.js # create + edit (same form)
components/Filters.js       # priority, assignee, text search
components/ConfirmDelete.js
```

- [x] Layout: navbar + `container-fluid` + `row` with 3 `col-12 col-md-4` columns (stacks on mobile)
- [x] Column header with task count badge
- [x] Task card: priority as coloured badge (`LOW` secondary, `MEDIUM` warning, `HIGH` danger),
      overdue due date highlighted in red
- [x] Create task: "Nowe zadanie" button → modal with form
- [x] Edit task: open the same modal prefilled → `PUT`
- [x] Change status: buttons "←/→" or a select on the card → `PATCH` (drag & drop is optional, see Extras)
- [x] Delete: confirmation modal → `DELETE`
- [x] Filters by priority and assignee (via API query params or client-side)
- [x] Form validation: Bootstrap `is-invalid` + `invalid-feedback`, show server `400` details per field
- [x] Loading state (spinner), empty column state, error alert/toast when the API fails
- [x] Modals: either control them with React state (simplest) or load Bootstrap JS in a client component via
      `useEffect(() => { import('bootstrap/dist/js/bootstrap.bundle.min.js') }, [])`
- [x] Add `data-testid` attributes to key elements (columns, cards, form fields) – makes Phase 4 much easier

**Checkpoint:** full CRUD works in the browser on desktop and in mobile view (DevTools).

---

## Phase 4 – Playwright tests (E2E)

- [ ] `playwright.config.js`:
  - `webServer: { command: 'npm run build && npm run start -- -p 3100', url: 'http://localhost:3100', reuseExistingServer: false, env: { DB_PATH: 'data/test.db', E2E: '1' } }`
    – a separate port and `reuseExistingServer: false` keep tests from hitting a running dev server and your real DB
  - `use: { baseURL: 'http://localhost:3100' }`
  - projects: chromium (+ optionally a mobile device, e.g. `devices['Pixel 7']`)
- [x] Isolated test data: a separate DB (`DB_PATH`), cleared before each test – e.g. a test-only endpoint
      `POST /api/test/reset` enabled only when `process.env.E2E === '1'` (not a `NODE_ENV` check: `next start`
      always sets `NODE_ENV=production`, so such an endpoint would be disabled during the tests), or delete
      tasks through the API in `beforeEach`
- [x] Use `workers: 1` (shared SQLite file) or one DB per worker

Test scenarios:

**UI – positive**
- [ ] board shows three columns
- [ ] create a task → appears in "Do zrobienia"
- [ ] edit title/priority → card updated
- [ ] move a task TODO → IN_PROGRESS → DONE
- [ ] delete a task (with confirmation) → card disappears
- [ ] filter by priority / assignee shows only matching tasks
- [ ] data persists after page reload

**UI – negative**
- [ ] empty title / title shorter than 3 chars → error message, task not created
- [ ] invalid due date → error message
- [ ] cancel in delete dialog → task stays

**API (Playwright `request` fixture)**
- [x] `POST` valid → `201`; invalid → `400` with `details`
- [x] `GET /api/tasks/999999` → `404`
- [x] `PATCH` with invalid status → `400`
- [x] `DELETE` → `204`, then `GET` → `404`

**Checkpoint:** `npm run test:e2e` is green; HTML report (`npx playwright show-report`) available.

---

## Phase 5 – Documentation and delivery

- [ ] Fix README section numbering and make the repo URL a real link
- [ ] Update the README runtime line from Node `>= 18.x` / `20.x` to Node `>= 20` (matching `engines`)
- [ ] Add to README: requirements, install, `db:seed`, run dev/prod, run tests, API endpoint table
- [ ] Screenshots of the board (desktop + mobile) in `docs/`
- [ ] Optional: GitHub Actions workflow running `npm ci`, `npx playwright install --with-deps`, `npm run test:e2e`
- [ ] Final check: fresh clone → install → seed → run → tests pass

---

## Extras (if time allows)

- Drag & drop between columns (`@dnd-kit/core` or native HTML5 DnD) → `PATCH status`
- Sorting within a column (by priority / due date)
- Search by title
- Dark mode (`data-bs-theme="dark"`)
- Statistics bar (tasks per status, overdue count)

---

## Suggested order of work / time estimate

| Week | Scope |
| :-- | :-- |
| 1 | Phase 0 + Phase 1 |
| 2 | Phase 2 (API complete, tested manually) |
| 3 | Phase 3 (UI CRUD + filters) |
| 4 | Phase 4 (tests) + Phase 5 (docs) |

Commit after each checkbox group – small commits with clear messages make the project history easy to review.
