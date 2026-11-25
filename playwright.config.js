import { defineConfig } from "@playwright/test";

// Tests run against a production build on port 3100 with their own database,
// so they never touch the dev server or data/kanban.db.
export default defineConfig({
  testDir: "tests",
  workers: 1, // all tests share one SQLite file
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100/api/tasks",
    reuseExistingServer: false,
    timeout: 180_000,
    env: { DB_PATH: "data/test.db" },
  },
});
