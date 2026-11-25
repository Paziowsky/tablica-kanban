// Shared helpers for the /api/tasks route handlers.

export function errorResponse(status, error, details) {
  return Response.json(details ? { error, details } : { error }, { status });
}

// Returns the parsed body, or a 400 Response when it is not valid JSON.
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON");
  }
}
