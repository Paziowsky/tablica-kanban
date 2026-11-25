// Polish labels and colours shared by the board components.

export const STATUS_LABELS = { TODO: "Do zrobienia", IN_PROGRESS: "W toku", DONE: "Zakończone" };
export const PRIORITY_LABELS = { LOW: "Niski", MEDIUM: "Średni", HIGH: "Wysoki" };
export const PRIORITY_COLORS = { LOW: "secondary", MEDIUM: "warning", HIGH: "danger" };

// "2026-11-25" -> "25.11.2026" (split instead of Date, so no time-zone shift).
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

// Today's local date as YYYY-MM-DD, comparable with dueDate strings.
export function today() {
  return new Date().toLocaleDateString("sv-SE");
}
