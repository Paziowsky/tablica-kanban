"use client";

import { useEffect, useState } from "react";
import ConfirmDelete from "./ConfirmDelete.js";
import Filters from "./Filters.js";
import TaskCard from "./TaskCard.js";
import TaskFormModal from "./TaskFormModal.js";
import { STATUS_LABELS } from "./labels.js";

const STATUSES = Object.keys(STATUS_LABELS);
const SAVE_FAILED = { body: "Nie udało się zapisać zadania. Spróbuj ponownie." };

// fetch wrapper: { ok, status, data }. Throws only when the server can't be reached.
async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

export default function Board() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ priority: "", assignee: "" });
  const [editing, setEditing] = useState(null); // null, "new" or the task being edited
  const [deleting, setDeleting] = useState(null); // the task waiting for confirmation

  const load = () =>
    api("GET", "/api/tasks")
      .then((res) => {
        if (!res.ok) throw new Error();
        setTasks(res.data);
      })
      .catch(() => setError("Nie udało się wczytać zadań. Odśwież stronę."))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  // Returns error details for the form, or null when saved.
  async function save(form) {
    try {
      const res = editing === "new"
        ? await api("POST", "/api/tasks", form)
        : await api("PUT", `/api/tasks/${editing.id}`, form);
      if (res.status === 400) return res.data?.details ?? SAVE_FAILED;
      if (res.status === 404) setError("To zadanie zostało już usunięte.");
      else if (!res.ok) return SAVE_FAILED;
    } catch {
      return SAVE_FAILED;
    }
    setEditing(null);
    await load();
    return null;
  }

  async function run(method, url, body, message) {
    try {
      const res = await api(method, url, body);
      if (!res.ok) setError(message);
    } catch {
      setError(message); // server unreachable: reloading would only replace this message
      return;
    }
    await load();
  }

  const move = (task, status) =>
    run("PATCH", `/api/tasks/${task.id}`, { status }, "Nie udało się zmienić statusu zadania.");

  async function remove(task) {
    await run("DELETE", `/api/tasks/${task.id}`, undefined, "Nie udało się usunąć zadania.");
    setDeleting(null);
  }

  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"));
  // A person whose last task was deleted or reassigned drops out of the filter.
  const active = { ...filters, assignee: assignees.includes(filters.assignee) ? filters.assignee : "" };
  const visible = tasks.filter(
    (t) => (!active.priority || t.priority === active.priority) && (!active.assignee || t.assignee === active.assignee),
  );

  return (
    <>
      {/* inert: while a popup is open, the board behind it can't be focused or clicked */}
      <div inert={Boolean(editing || deleting)}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Filters filters={active} assignees={assignees} onChange={setFilters} />
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")} data-testid="new-task">
          Nowe zadanie
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible" role="alert" data-testid="error-alert">
          {error}
          <button type="button" className="btn-close" aria-label="Zamknij" onClick={() => setError(null)} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Wczytywanie…</span>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {STATUSES.map((status, index) => {
            const columnTasks = visible.filter((t) => t.status === status);
            return (
              <section key={status} className="col-12 col-md-4" data-testid={`column-${status}`}>
                <div className="bg-body-tertiary rounded p-2 h-100">
                  <h2 className="fs-6 d-flex justify-content-between align-items-center px-1 mb-2">
                    {STATUS_LABELS[status]}
                    <span className="badge text-bg-secondary rounded-pill" data-testid="column-count">{columnTasks.length}</span>
                  </h2>
                  {columnTasks.length === 0 && <p className="text-body-secondary small text-center py-3 mb-0">Brak zadań</p>}
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      prevStatus={STATUSES[index - 1]}
                      nextStatus={STATUSES[index + 1]}
                      onMove={move}
                      onEdit={setEditing}
                      onDelete={setDeleting}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      </div>

      {editing && <TaskFormModal task={editing === "new" ? null : editing} onSave={save} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDelete task={deleting} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </>
  );
}
