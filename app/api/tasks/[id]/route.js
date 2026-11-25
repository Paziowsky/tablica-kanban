import { errorResponse, readJson } from "@/lib/http.js";
import { deleteTask, getTask, patchTask, updateTask } from "@/lib/tasks.js";
import { validateTask } from "@/lib/validation.js";

// Returns the id as a number, or null when it is not a positive integer.
async function readId(params) {
  const { id } = await params;
  return /^[1-9]\d*$/.test(id) ? Number(id) : null;
}

const invalidId = () => errorResponse(400, "Invalid id");
const notFound = () => errorResponse(404, "Task not found");

// GET /api/tasks/:id
export async function GET(request, { params }) {
  const id = await readId(params);
  if (id === null) return invalidId();
  const task = getTask(id);
  return task ? Response.json(task) : notFound();
}

// PUT replaces the whole task, PATCH changes only the fields sent.
async function save(request, params, partial) {
  const id = await readId(params);
  if (id === null) return invalidId();

  const body = await readJson(request);
  if (body instanceof Response) return body;

  const { valid, errors, value } = validateTask(body, { partial });
  if (!valid) return errorResponse(400, "Validation failed", errors);

  const task = partial ? patchTask(id, value) : updateTask(id, value);
  return task ? Response.json(task) : notFound();
}

export function PUT(request, { params }) {
  return save(request, params, false);
}

export function PATCH(request, { params }) {
  return save(request, params, true);
}

// DELETE /api/tasks/:id
export async function DELETE(request, { params }) {
  const id = await readId(params);
  if (id === null) return invalidId();
  return deleteTask(id) ? new Response(null, { status: 204 }) : notFound();
}
