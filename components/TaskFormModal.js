"use client";

import { useState } from "react";
import Modal from "./Modal.js";
import { PRIORITY_LABELS, STATUS_LABELS } from "./labels.js";

const EMPTY = { title: "", description: "", status: "TODO", priority: "MEDIUM", assignee: "", dueDate: "" };

// One form for create (task = null) and edit. onSave returns server error details, or null on success.
export default function TaskFormModal({ task, onSave, onClose }) {
  const [form, setForm] = useState(() =>
    task ? { ...EMPTY, ...task, assignee: task.assignee ?? "", dueDate: task.dueDate ?? "" } : EMPTY,
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const { title, description, status, priority, assignee, dueDate } = form;
    const details = await onSave({ title, description, status, priority, assignee, dueDate });
    setSaving(false);
    if (details) setErrors(details);
  }

  // Bootstrap form control with its server error shown underneath.
  const field = (name, label, input) => (
    <div className="mb-3">
      <label htmlFor={`task-${name}`} className="form-label">{label}</label>
      {input({
        id: `task-${name}`,
        value: form[name],
        onChange: set(name),
        "data-testid": `field-${name}`,
        "aria-invalid": Boolean(errors[name]),
        "aria-describedby": errors[name] ? `task-${name}-error` : undefined,
      })}
      {errors[name] && <div className="invalid-feedback" id={`task-${name}-error`}>{errors[name]}</div>}
    </div>
  );
  const invalid = (name) => (errors[name] ? " is-invalid" : "");

  return (
    <Modal
      title={task ? "Edytuj zadanie" : "Nowe zadanie"}
      onClose={onClose}
      testId="task-form"
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Anuluj</button>
          <button type="submit" form="task-form" className="btn btn-primary" disabled={saving}>
            {saving ? "Zapisywanie…" : "Zapisz"}
          </button>
        </>
      }
    >
      <form id="task-form" noValidate onSubmit={submit}>
        {errors.body && <div className="alert alert-danger">{errors.body}</div>}
        {field("title", "Tytuł", (props) => <input type="text" className={`form-control${invalid("title")}`} autoFocus {...props} />)}
        {field("description", "Opis", (props) => <textarea rows={3} className={`form-control${invalid("description")}`} {...props} />)}
        <div className="row">
          <div className="col-sm-6">
            {field("status", "Status", (props) => (
              <select className={`form-select${invalid("status")}`} {...props}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            ))}
          </div>
          <div className="col-sm-6">
            {field("priority", "Priorytet", (props) => (
              <select className={`form-select${invalid("priority")}`} {...props}>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            ))}
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            {field("assignee", "Osoba odpowiedzialna", (props) => <input type="text" className={`form-control${invalid("assignee")}`} {...props} />)}
          </div>
          <div className="col-sm-6">
            {field("dueDate", "Termin", (props) => <input type="date" className={`form-control${invalid("dueDate")}`} {...props} />)}
          </div>
        </div>
      </form>
    </Modal>
  );
}
