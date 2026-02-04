import { defineConfig, devices } from "@playwright/test";

// Utiliser la variable d'env ou la prod par défaut pour les audits
const isAudit = process.env.TEST_AUDIT === "true";
const baseURL =
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (isAudit ? "https://evidive.blue" : "http://localhost:3000");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 60000, // 60s par test
  expect: {
    timeout: 10000, // 10s pour les assertions
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Ne pas démarrer de serveur local si on teste la prod
  ...(baseURL.includes("localhost") && {
    webServer: {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120000,
    },
  }),
});
