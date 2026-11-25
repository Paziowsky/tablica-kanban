// Browser tests for the board (ROADMAP Phase 4: UI positive and negative scenarios).
// Setup data goes through the API; the behaviour under test goes through the UI.
import { test, expect } from "@playwright/test";

// Start every test from an empty board, cleared through the API.
test.beforeEach(async ({ request, page }) => {
  const tasks = await (await request.get("/api/tasks")).json();
  for (const task of tasks) await request.delete(`/api/tasks/${task.id}`);
  await page.goto("/");
});

async function createTask(request, data) {
  const res = await request.post("/api/tasks", { data });
  expect(res.status()).toBe(201);
  return res.json();
}

// Days from today as a local YYYY-MM-DD string (same as the app's today()).
function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("sv-SE");
}

const column = (page, status) => page.getByTestId(`column-${status}`);
const card = (page, title) => page.getByTestId("task-card").filter({ hasText: title });
const form = (page) => page.getByTestId("task-form");

async function openNewTaskForm(page) {
  await page.getByTestId("new-task").click();
  await expect(form(page)).toBeVisible();
}

test.describe("board – positive", () => {
  test("shows three columns with Polish names", async ({ page }) => {
    await expect(column(page, "TODO")).toContainText("Do zrobienia");
    await expect(column(page, "IN_PROGRESS")).toContainText("W toku");
    await expect(column(page, "DONE")).toContainText("Zakończone");
    for (const status of ["TODO", "IN_PROGRESS", "DONE"]) {
      await expect(column(page, status).getByTestId("column-count")).toHaveText("0");
      await expect(column(page, status)).toContainText("Brak zadań");
    }
  });

  test("creates a task that appears in 'Do zrobienia'", async ({ page }) => {
    await openNewTaskForm(page);
    await form(page).getByLabel("Tytuł").fill("Przygotować prezentację");
    await form(page).getByLabel("Opis").fill("Slajdy na demo projektu.");
    await form(page).getByLabel("Priorytet").selectOption("HIGH");
    await form(page).getByLabel("Osoba odpowiedzialna").fill("Anna Nowak");
    await form(page).getByLabel("Termin").fill(daysFromNow(7));
    await form(page).getByRole("button", { name: "Zapisz" }).click();

    await expect(form(page)).toBeHidden();
    const created = card(page, "Przygotować prezentację");
    await expect(column(page, "TODO").getByTestId("task-card")).toHaveCount(1);
    await expect(created.getByTestId("task-priority")).toHaveText("Wysoki");
    await expect(created.getByTestId("task-assignee")).toContainText("Anna Nowak");
    await expect(created.getByTestId("task-due-date")).not.toContainText("po terminie");
    await expect(column(page, "TODO").getByTestId("column-count")).toHaveText("1");
  });

  test("edits the title and priority of a task", async ({ page, request }) => {
    await createTask(request, { title: "Stary tytuł", priority: "LOW", status: "IN_PROGRESS", assignee: "Jan" });
    await page.reload();

    await card(page, "Stary tytuł").getByRole("button", { name: "Edytuj" }).click();
    await expect(form(page).getByLabel("Tytuł")).toHaveValue("Stary tytuł");
    await form(page).getByLabel("Tytuł").fill("Nowy tytuł");
    await form(page).getByLabel("Priorytet").selectOption("HIGH");
    await form(page).getByRole("button", { name: "Zapisz" }).click();

    await expect(form(page)).toBeHidden();
    const edited = card(page, "Nowy tytuł");
    await expect(edited.getByTestId("task-priority")).toHaveText("Wysoki");
    // The edit form sends the status and assignee too, so PUT doesn't reset them.
    await expect(column(page, "IN_PROGRESS")).toContainText("Nowy tytuł");
    await expect(edited.getByTestId("task-assignee")).toContainText("Jan");
    await expect(page.getByText("Stary tytuł")).toHaveCount(0);
  });

  test("moves a task TODO → IN_PROGRESS → DONE and back", async ({ page, request }) => {
    await createTask(request, { title: "Zadanie w ruchu" });
    await page.reload();
    const moving = card(page, "Zadanie w ruchu");

    await expect(moving.getByRole("button", { name: "Przenieś w lewo" })).toBeDisabled();
    await moving.getByRole("button", { name: "Przenieś do: W toku" }).click();
    await expect(column(page, "IN_PROGRESS")).toContainText("Zadanie w ruchu");

    await moving.getByRole("button", { name: "Przenieś do: Zakończone" }).click();
    await expect(column(page, "DONE")).toContainText("Zadanie w ruchu");
    await expect(moving.getByRole("button", { name: "Przenieś w prawo" })).toBeDisabled();
    await expect(column(page, "TODO").getByTestId("task-card")).toHaveCount(0);

    await moving.getByRole("button", { name: "Przenieś do: W toku" }).click();
    await expect(column(page, "IN_PROGRESS")).toContainText("Zadanie w ruchu");
  });

  test("deletes a task after confirmation", async ({ page, request }) => {
    await createTask(request, { title: "Do usunięcia" });
    await page.reload();

    await card(page, "Do usunięcia").getByRole("button", { name: "Usuń" }).click();
    const dialog = page.getByTestId("confirm-delete");
    await expect(dialog).toContainText("Do usunięcia");
    await dialog.getByRole("button", { name: "Usuń" }).click();

    await expect(dialog).toBeHidden();
    await expect(card(page, "Do usunięcia")).toHaveCount(0);
    expect(await (await request.get("/api/tasks")).json()).toHaveLength(0);
  });

  test("filters by priority and by assignee", async ({ page, request }) => {
    await createTask(request, { title: "Pilne Ani", priority: "HIGH", assignee: "Anna" });
    await createTask(request, { title: "Zwykłe Ani", priority: "MEDIUM", assignee: "Anna" });
    await createTask(request, { title: "Pilne Jana", priority: "HIGH", assignee: "Jan", status: "DONE" });
    await page.reload();
    await expect(page.getByTestId("task-card")).toHaveCount(3);

    await page.getByTestId("filter-priority").selectOption("HIGH");
    await expect(page.getByTestId("task-card")).toHaveCount(2);
    await expect(card(page, "Zwykłe Ani")).toHaveCount(0);

    await page.getByTestId("filter-assignee").selectOption("Anna");
    await expect(page.getByTestId("task-card")).toHaveCount(1);
    await expect(card(page, "Pilne Ani")).toBeVisible();

    await page.getByTestId("filter-priority").selectOption("");
    await expect(page.getByTestId("task-card")).toHaveCount(2);
    await expect(card(page, "Pilne Jana")).toHaveCount(0);
  });

  test("data persists after a page reload", async ({ page }) => {
    await openNewTaskForm(page);
    await form(page).getByLabel("Tytuł").fill("Zadanie trwałe");
    await form(page).getByLabel("Status").selectOption("IN_PROGRESS");
    await form(page).getByRole("button", { name: "Zapisz" }).click();
    await expect(column(page, "IN_PROGRESS")).toContainText("Zadanie trwałe");

    await page.reload();
    await expect(column(page, "IN_PROGRESS")).toContainText("Zadanie trwałe");
  });

  test("highlights an overdue task, but not one that is done", async ({ page, request }) => {
    await createTask(request, { title: "Spóźnione", dueDate: daysFromNow(-2) });
    await createTask(request, { title: "Zrobione po czasie", dueDate: daysFromNow(-2), status: "DONE" });
    await page.reload();

    const late = card(page, "Spóźnione").getByTestId("task-due-date");
    await expect(late).toContainText("(po terminie)");
    await expect(late).toHaveClass(/text-danger/);
    await expect(card(page, "Zrobione po czasie").getByTestId("task-due-date")).not.toContainText("po terminie");
  });
});

test.describe("board – negative", () => {
  test("empty title shows an error and creates no task", async ({ page, request }) => {
    await openNewTaskForm(page);
    await form(page).getByRole("button", { name: "Zapisz" }).click();

    await expect(form(page).getByLabel("Tytuł")).toHaveClass(/is-invalid/);
    await expect(form(page)).toContainText("co najmniej 3 znaki");
    expect(await (await request.get("/api/tasks")).json()).toHaveLength(0);
  });

  test("a title shorter than 3 characters shows an error and creates no task", async ({ page, request }) => {
    await openNewTaskForm(page);
    await form(page).getByLabel("Tytuł").fill("ab");
    await form(page).getByRole("button", { name: "Zapisz" }).click();

    await expect(form(page)).toContainText("co najmniej 3 znaki");
    await expect(form(page)).toBeVisible();

    // Fixing the title and saving again works.
    await form(page).getByLabel("Tytuł").fill("abc");
    await form(page).getByRole("button", { name: "Zapisz" }).click();
    await expect(form(page)).toBeHidden();
    expect(await (await request.get("/api/tasks")).json()).toHaveLength(1);
  });

  test("an invalid due date shows an error and creates no task", async ({ page, request }) => {
    // <input type="date"> can't hold an impossible date, so swap it into the
    // request on its way to the real server and check the form shows the 400.
    await page.route("**/api/tasks", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const body = { ...route.request().postDataJSON(), dueDate: "2026-02-30" };
      return route.continue({ postData: JSON.stringify(body) });
    });

    await openNewTaskForm(page);
    await form(page).getByLabel("Tytuł").fill("Zła data");
    await form(page).getByLabel("Termin").fill(daysFromNow(1));
    await form(page).getByRole("button", { name: "Zapisz" }).click();

    await expect(form(page).getByLabel("Termin")).toHaveClass(/is-invalid/);
    await expect(form(page)).toContainText("RRRR-MM-DD");
    expect(await (await request.get("/api/tasks")).json()).toHaveLength(0);
  });

  test("cancel in the delete dialog keeps the task", async ({ page, request }) => {
    await createTask(request, { title: "Zostaję" });
    await page.reload();

    await card(page, "Zostaję").getByRole("button", { name: "Usuń" }).click();
    const dialog = page.getByTestId("confirm-delete");
    await dialog.getByRole("button", { name: "Anuluj" }).click();

    await expect(dialog).toBeHidden();
    await expect(card(page, "Zostaję")).toBeVisible();
    expect(await (await request.get("/api/tasks")).json()).toHaveLength(1);
  });

  test("Escape closes the form without saving", async ({ page, request }) => {
    await openNewTaskForm(page);
    await form(page).getByLabel("Tytuł").fill("Porzucone");
    await page.keyboard.press("Escape");

    await expect(form(page)).toBeHidden();
    await expect(page.getByTestId("task-card")).toHaveCount(0);
    expect(await (await request.get("/api/tasks")).json()).toHaveLength(0);
  });
});
