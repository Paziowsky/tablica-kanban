// API tests for /api/tasks, using Playwright's request fixture (no browser).
import { test, expect } from "@playwright/test";

// Start every test from an empty board, cleared through the API itself.
test.beforeEach(async ({ request }) => {
  const tasks = await (await request.get("/api/tasks")).json();
  for (const task of tasks) await request.delete(`/api/tasks/${task.id}`);
});

async function createTask(request, data) {
  const res = await request.post("/api/tasks", { data });
  expect(res.status()).toBe(201);
  return res.json();
}

test.describe("POST /api/tasks", () => {
  test("creates a task with defaults and a Location header", async ({ request }) => {
    const res = await request.post("/api/tasks", { data: { title: "Pierwsze zadanie", assignee: "Ala" } });
    expect(res.status()).toBe(201);
    const task = await res.json();
    expect(res.headers()["location"]).toBe(`/api/tasks/${task.id}`);
    expect(task).toMatchObject({ title: "Pierwsze zadanie", status: "TODO", priority: "MEDIUM", assignee: "Ala" });
  });

  test("rejects invalid data with 400 and details", async ({ request }) => {
    const res = await request.post("/api/tasks", { data: { title: "ab", priority: "URGENT" } });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(Object.keys(body.details).sort()).toEqual(["priority", "title"]);
  });

  test("rejects a body that is not JSON", async ({ request }) => {
    const res = await request.post("/api/tasks", { data: Buffer.from("{not json"), headers: { "Content-Type": "application/json" } });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("Invalid JSON");
  });
});

test.describe("GET /api/tasks", () => {
  test("lists tasks and filters them", async ({ request }) => {
    const first = await createTask(request, { title: "Pierwsze", priority: "HIGH", assignee: "Ala" });
    await createTask(request, { title: "Drugie", status: "DONE" });

    const all = await (await request.get("/api/tasks")).json();
    expect(all).toHaveLength(2);

    const done = await (await request.get("/api/tasks?status=DONE")).json();
    expect(done.map((t) => t.title)).toEqual(["Drugie"]);

    const mine = await (await request.get("/api/tasks?priority=HIGH&assignee=Ala")).json();
    expect(mine.map((t) => t.id)).toEqual([first.id]);
  });

  test("rejects an unknown filter value", async ({ request }) => {
    const res = await request.get("/api/tasks?status=NOPE");
    expect(res.status()).toBe(400);
    expect((await res.json()).details.status).toBeTruthy();
  });
});

test.describe("/api/tasks/:id", () => {
  test("GET returns the task, 404 when missing, 400 for a bad id", async ({ request }) => {
    const task = await createTask(request, { title: "Jedno zadanie" });
    expect((await (await request.get(`/api/tasks/${task.id}`)).json()).title).toBe("Jedno zadanie");
    expect((await request.get("/api/tasks/999999")).status()).toBe(404);
    for (const bad of ["abc", "0", "-1", "1.5"]) {
      expect((await request.get(`/api/tasks/${bad}`)).status(), bad).toBe(400);
    }
  });

  test("PATCH changes only the fields sent", async ({ request }) => {
    const task = await createTask(request, { title: "Do przesunięcia", assignee: "Ala" });
    const res = await request.patch(`/api/tasks/${task.id}`, { data: { status: "DONE" } });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: "DONE", assignee: "Ala", title: "Do przesunięcia" });
  });

  test("PATCH rejects an invalid status, an empty body and a missing task", async ({ request }) => {
    const task = await createTask(request, { title: "Zadanie" });
    expect((await request.patch(`/api/tasks/${task.id}`, { data: { status: "WRONG" } })).status()).toBe(400);
    expect((await request.patch(`/api/tasks/${task.id}`, { data: {} })).status()).toBe(400);
    expect((await request.patch("/api/tasks/999999", { data: { status: "DONE" } })).status()).toBe(404);
  });

  test("PUT replaces the task and resets fields left out", async ({ request }) => {
    const task = await createTask(request, { title: "Stary tytuł", status: "DONE", assignee: "Ala" });
    const res = await request.put(`/api/tasks/${task.id}`, { data: { title: "Nowy tytuł", priority: "LOW" } });
    expect(res.status()).toBe(200);
    const updated = await res.json();
    expect(updated).toMatchObject({ title: "Nowy tytuł", priority: "LOW", status: "TODO", assignee: null });
    expect(updated.createdAt).toBe(task.createdAt);

    expect((await request.put(`/api/tasks/${task.id}`, { data: { priority: "LOW" } })).status()).toBe(400);
    expect((await request.put("/api/tasks/999999", { data: { title: "abc" } })).status()).toBe(404);
  });

  test("DELETE returns 204, then the task is gone", async ({ request }) => {
    const task = await createTask(request, { title: "Do usunięcia" });
    const res = await request.delete(`/api/tasks/${task.id}`);
    expect(res.status()).toBe(204);
    expect(await res.text()).toBe("");
    expect((await request.get(`/api/tasks/${task.id}`)).status()).toBe(404);
    expect((await request.delete(`/api/tasks/${task.id}`)).status()).toBe(404);
  });

  test("an emoji title too short for the database gets 400, not 500", async ({ request }) => {
    const res = await request.post("/api/tasks", { data: { title: "😀😀" } });
    expect(res.status()).toBe(400);
    expect((await res.json()).details.title).toBeTruthy();
  });
});
