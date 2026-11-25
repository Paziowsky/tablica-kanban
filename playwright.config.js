import { defineConfig, devices } from "@playwright/test";

// Tests run against a production build on port 3100 with their own database,
// so they never touch the dev server or data/kanban.db.
export default defineConfig({
  testDir: "tests",
  workers: 1, // all tests share one SQLite file
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    // API and validation tests need no browser, so they run once.
    { name: "api", testMatch: /(api|validation)\.spec\.js/ },
    // UI tests run on desktop and on a phone-sized screen (both Chromium).
    { name: "chromium", testMatch: /ui\.spec\.js/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testMatch: /ui\.spec\.js/, use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100/api/tasks",
    reuseExistingServer: false,
    timeout: 180_000,
    env: { DB_PATH: "data/test.db" },
  },
});
