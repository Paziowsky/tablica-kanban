import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS, formatDate, today } from "./labels.js";

export default function TaskCard({ task, prevStatus, nextStatus, onMove, onEdit, onDelete }) {
  const overdue = task.dueDate && task.status !== "DONE" && task.dueDate < today();

  return (
    <div className="card mb-2 shadow-sm" data-testid="task-card" data-task-id={task.id}>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h3 className="card-title fs-6 mb-1" data-testid="task-title">{task.title}</h3>
          <span className={`badge text-bg-${PRIORITY_COLORS[task.priority]}`} data-testid="task-priority">
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
        {task.description && <p className="card-text small text-body-secondary mb-2">{task.description}</p>}
        <div className="small">
          {task.assignee && <div data-testid="task-assignee"><span aria-hidden="true">👤 </span>{task.assignee}</div>}
          {task.dueDate && (
            <div className={overdue ? "text-danger fw-semibold" : ""} data-testid="task-due-date">
              <span aria-hidden="true">📅 </span>{formatDate(task.dueDate)}{overdue && " (po terminie)"}
            </div>
          )}
        </div>
        <div className="d-flex gap-1 mt-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!prevStatus}
            onClick={() => onMove(task, prevStatus)}
            aria-label={prevStatus ? `Przenieś do: ${STATUS_LABELS[prevStatus]}` : "Przenieś w lewo"}>
            ←
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!nextStatus}
            onClick={() => onMove(task, nextStatus)}
            aria-label={nextStatus ? `Przenieś do: ${STATUS_LABELS[nextStatus]}` : "Przenieś w prawo"}>
            →
          </button>
          <button type="button" className="btn btn-sm btn-outline-primary ms-auto" onClick={() => onEdit(task)}>
            Edytuj
          </button>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(task)}>
            Usuń
          </button>
        </div>
      </div>
    </div>
  );
}
