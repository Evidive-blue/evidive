import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "on",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // No webServer - use existing dev server
});
