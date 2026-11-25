import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL CHECK (length(title) >= 3),
  description TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'TODO'   CHECK (status   IN ('TODO','IN_PROGRESS','DONE')),
  priority    TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH')),
  assignee    TEXT,
  dueDate     TEXT,
  createdAt   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
`;

function open() {
  const dbPath = process.env.DB_PATH || "data/kanban.db";
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  return db;
}

// One connection per process; cached on globalThis so dev hot reload reuses it.
export function getDb() {
  globalThis.__kanbanDb ??= open();
  return globalThis.__kanbanDb;
}
