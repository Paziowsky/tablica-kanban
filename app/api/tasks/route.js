import { errorResponse, readJson } from "@/lib/http.js";
import { createTask, listTasks } from "@/lib/tasks.js";
import { PRIORITIES, STATUSES, validateTask } from "@/lib/validation.js";

// GET /api/tasks?status=&priority=&assignee=
// Reading the query string makes Next.js run this per request instead of prerendering it.
export function GET(request) {
  const query = request.nextUrl.searchParams;
  const filters = {
    status: query.get("status") || undefined,
    priority: query.get("priority") || undefined,
    assignee: query.get("assignee") || undefined,
  };

  const details = {};
  if (filters.status && !STATUSES.includes(filters.status)) details.status = `Dozwolone: ${STATUSES.join(", ")}.`;
  if (filters.priority && !PRIORITIES.includes(filters.priority)) details.priority = `Dozwolone: ${PRIORITIES.join(", ")}.`;
  if (Object.keys(details).length) return errorResponse(400, "Invalid filter", details);

  return Response.json(listTasks(filters));
}

// POST /api/tasks
export async function POST(request) {
  const body = await readJson(request);
  if (body instanceof Response) return body;

  const { valid, errors, value } = validateTask(body);
  if (!valid) return errorResponse(400, "Validation failed", errors);

  const task = createTask(value);
  return Response.json(task, { status: 201, headers: { Location: `/api/tasks/${task.id}` } });
}
