import { defineConfig, devices } from "@playwright/test";

/**
 * EviDive Playwright E2E Test Configuration
 *
 * Run tests with:
 *   pnpm test:e2e           - Run all E2E tests
 *   pnpm test:e2e:ui        - Run with UI mode
 *   pnpm test:e2e:headed    - Run with browser visible
 *   pnpm test:e2e:debug     - Run in debug mode
 */

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  outputDir: "test-results",

  /* Increase global timeout for slow dev server */
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile viewports
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
    // Tablet
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"] },
    },
  ],

  // Run local dev server before tests (skip if SKIP_WEB_SERVER is set)
  webServer: process.env.SKIP_WEB_SERVER
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
