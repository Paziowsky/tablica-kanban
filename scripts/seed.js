// Runs under plain Node (npm run db:seed), so imports are relative, not "@/".
import { getDb } from "../lib/db.js";
import { createTask } from "../lib/tasks.js";

// Dates relative to today, so the overdue task stays overdue whenever you seed.
function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("sv-SE"); // local YYYY-MM-DD (toISOString would use UTC)
}

const tasks = [
  { title: "Przygotować makietę tablicy", description: "Szkic trzech kolumn i karty zadania.", status: "DONE", priority: "MEDIUM", assignee: "Anna Nowak", dueDate: daysFromNow(-7) },
  { title: "Skonfigurować bazę SQLite", description: "Schemat tabeli tasks i połączenie.", status: "DONE", priority: "HIGH", assignee: "Jan Kowalski", dueDate: daysFromNow(-3) },
  { title: "Napisać endpointy REST", description: "GET, POST, PUT, PATCH, DELETE dla /api/tasks.", status: "IN_PROGRESS", priority: "HIGH", assignee: "Jan Kowalski", dueDate: daysFromNow(3) },
  { title: "Formularz nowego zadania", description: "Modal z walidacją pól.", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "Anna Nowak", dueDate: daysFromNow(5) },
  { title: "Oddać raport z postępów", description: "To zadanie jest po terminie (do pokazania podświetlenia).", status: "TODO", priority: "HIGH", assignee: "Piotr Wiśniewski", dueDate: daysFromNow(-2) },
  { title: "Filtry priorytetu i osoby", description: "", status: "TODO", priority: "MEDIUM", assignee: "Anna Nowak", dueDate: daysFromNow(10) },
  { title: "Testy E2E w Playwright", description: "Scenariusze pozytywne i negatywne.", status: "TODO", priority: "LOW", assignee: "Piotr Wiśniewski", dueDate: daysFromNow(14) },
  { title: "Zrzuty ekranu do README", description: "Wersja desktop i mobilna.", status: "TODO", priority: "LOW", assignee: null, dueDate: null },
];

const db = getDb();
db.transaction(() => {
  // Start from a clean table so re-running the seed gives the same board.
  db.exec("DELETE FROM tasks; DELETE FROM sqlite_sequence WHERE name = 'tasks';");
  tasks.forEach((task) => createTask(task));
})();

console.log(`Seeded ${tasks.length} tasks into ${process.env.DB_PATH || "data/kanban.db"}`);
