import { getDb } from "./db.js";

// Callers pass data already checked by validateTask (lib/validation.js).
const FIELDS = ["title", "description", "status", "priority", "assignee", "dueDate"];
const DEFAULTS = { description: "", status: "TODO", priority: "MEDIUM", assignee: null, dueDate: null };

export function listTasks({ status, priority, assignee } = {}) {
  const filters = { status, priority, assignee };
  const where = Object.keys(filters)
    .filter((key) => filters[key])
    .map((key) => `${key} = @${key}`);
  const sql = `SELECT * FROM tasks ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY id`;
  return getDb().prepare(sql).all(filters);
}

export function getTask(id) {
  return getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id) ?? null;
}

export function createTask(data) {
  const task = { ...DEFAULTS, ...data };
  const { lastInsertRowid } = getDb()
    .prepare(
      `INSERT INTO tasks (title, description, status, priority, assignee, dueDate)
       VALUES (@title, @description, @status, @priority, @assignee, @dueDate)`,
    )
    .run(task);
  return getTask(lastInsertRowid);
}

// PUT: replaces every editable field; fields left out go back to their defaults.
export function updateTask(id, data) {
  return patchTask(id, { ...DEFAULTS, ...data });
}

// PATCH: changes only the fields given. Returns null when the task does not exist.
export function patchTask(id, partial) {
  const keys = FIELDS.filter((key) => partial[key] !== undefined);
  if (keys.length === 0) return getTask(id);
  const sets = keys.map((key) => `${key} = @${key}`).join(", ");
  const values = Object.fromEntries(keys.map((key) => [key, partial[key]]));
  const { changes } = getDb()
    .prepare(`UPDATE tasks SET ${sets} WHERE id = @id`)
    .run({ ...values, id });
  return changes ? getTask(id) : null;
}

export function deleteTask(id) {
  return getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id).changes > 0;
}
