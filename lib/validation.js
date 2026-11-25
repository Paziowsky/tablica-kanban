export const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  // Rejects dates that roll over, e.g. 2026-02-30.
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Optional text field: missing, null or "" all mean "no value".
function optionalText(value, field, max, errors) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    errors[field] = "Musi być tekstem.";
    return;
  }
  const trimmed = value.trim();
  if (trimmed.length > max) errors[field] = `Maksymalnie ${max} znaków.`;
  return trimmed || null;
}

/**
 * Validates task input from the API or the form.
 * With { partial: true } (PATCH) only the fields present are checked.
 * Returns { valid, errors: { field: message }, value } where value holds the
 * cleaned fields that were present (trimmed, "" turned into null).
 */
export function validateTask(input, { partial = false } = {}) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, errors: { body: "Oczekiwano obiektu JSON." }, value: {} };
  }

  const errors = {};
  const value = {};
  const has = (field) => input[field] !== undefined;

  if (!partial || has("title")) {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const length = [...title].length; // counts an emoji as 1, like SQLite's length() in the CHECK
    if (length < 3) errors.title = "Tytuł musi mieć co najmniej 3 znaki.";
    else if (length > 120) errors.title = "Tytuł może mieć maksymalnie 120 znaków.";
    value.title = title;
  }

  if (has("description")) {
    value.description = optionalText(input.description, "description", 2000, errors) ?? "";
  }

  if (has("status")) {
    if (!STATUSES.includes(input.status)) errors.status = `Dozwolone: ${STATUSES.join(", ")}.`;
    value.status = input.status;
  }

  if (has("priority")) {
    if (!PRIORITIES.includes(input.priority)) errors.priority = `Dozwolone: ${PRIORITIES.join(", ")}.`;
    value.priority = input.priority;
  }

  if (has("assignee")) {
    value.assignee = optionalText(input.assignee, "assignee", 100, errors);
  }

  if (has("dueDate")) {
    const due = input.dueDate;
    if (due === null || due === "") value.dueDate = null;
    else if (typeof due !== "string" || !isValidDate(due)) errors.dueDate = "Podaj datę w formacie RRRR-MM-DD.";
    else value.dueDate = due;
  }

  const valid = Object.keys(errors).length === 0;
  if (valid && partial && Object.keys(value).length === 0) {
    return { valid: false, errors: { body: "Brak pól do zmiany." }, value };
  }
  return { valid, errors, value };
}
