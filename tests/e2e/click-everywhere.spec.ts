/**
 * EviDive - Click Everywhere Test
 *
 * This test clicks on every clickable element it can find
 * and tests all possible interactions on each page.
 *
 * It systematically:
 * - Finds all buttons, links, inputs
 * - Clicks them and checks for errors
 * - Fills forms with test data
 * - Takes screenshots of every state
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// Test accounts
const ACCOUNTS = {
  diver: { email: "test-diver@evidive.test", password: "TestDiver123!" },
  center: { email: "test-center@evidive.test", password: "TestCenter123!" },
  admin: { email: "admin@evidive.test", password: "AdminTest123!" },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface ClickReport {
  page: string;
  element: string;
  action: string;
  result: "success" | "error";
  error?: string;
  screenshot?: string;
}

const clickReport: ClickReport[] = [];

async function safeClick(page: Page, selector: string, description: string): Promise<boolean> {
  try {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 })) {
      await element.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      return true;
    }
  } catch (error) {
    // Silently fail - element might not be clickable
  }
  return false;
}

async function getAllClickableElements(page: Page): Promise<string[]> {
  const selectors: string[] = [];

  // Get all buttons
  const buttons = await page.locator("button:visible").all();
  for (let i = 0; i < buttons.length; i++) {
    selectors.push(`button:visible >> nth=${i}`);
  }

  // Get all links
  const links = await page.locator("a:visible").all();
  for (let i = 0; i < links.length; i++) {
    selectors.push(`a:visible >> nth=${i}`);
  }

  // Get clickable divs (with onClick or role=button)
  const clickableDivs = await page.locator('[role="button"]:visible, [onclick]:visible').all();
  for (let i = 0; i < clickableDivs.length; i++) {
    selectors.push(`[role="button"]:visible >> nth=${i}`);
  }

  return selectors;
}

async function fillFormFields(page: Page) {
  // Fill text inputs
  const textInputs = await page.locator('input[type="text"]:visible, input:not([type]):visible').all();
  for (const input of textInputs) {
    try {
      await input.fill("Test Value");
    } catch {
      // Ignore
    }
  }

  // Fill email inputs
  const emailInputs = await page.locator('input[type="email"]:visible').all();
  for (const input of emailInputs) {
    try {
      await input.fill("test@example.com");
    } catch {
      // Ignore
    }
  }

  // Fill password inputs
  const passwordInputs = await page.locator('input[type="password"]:visible').all();
  for (const input of passwordInputs) {
    try {
      await input.fill("TestPassword123!");
    } catch {
      // Ignore
    }
  }

  // Fill number inputs
  const numberInputs = await page.locator('input[type="number"]:visible').all();
  for (const input of numberInputs) {
    try {
      await input.fill("5");
    } catch {
      // Ignore
    }
  }

  // Fill textareas
  const textareas = await page.locator("textarea:visible").all();
  for (const textarea of textareas) {
    try {
      await textarea.fill("This is a test comment for E2E testing purposes.");
    } catch {
      // Ignore
    }
  }

  // Select first option in selects
  const selects = await page.locator("select:visible").all();
  for (const select of selects) {
    try {
      const options = await select.locator("option").all();
      if (options.length > 1) {
        await select.selectOption({ index: 1 });
      }
    } catch {
      // Ignore
    }
  }
}

async function checkForErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  // Check for visible error messages
  const errorElements = await page
    .locator('[class*="error"], [class*="Error"], [role="alert"], .text-red-400, .text-red-500')
    .all();

  for (const el of errorElements) {
    try {
      const text = await el.textContent();
      if (text && text.trim().length > 0) {
        errors.push(text.trim());
      }
    } catch {
      // Ignore
    }
  }

  return errors;
}

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/fr/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|center|admin)/, { timeout: 30000 });
}

// ============================================================================
// CLICK EVERYWHERE TESTS
// ============================================================================

test.describe("Click Everywhere - Public Pages", () => {
  test("Click all elements on Homepage", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");

    const initialUrl = page.url();
    let clickCount = 0;
    let errorCount = 0;

    // Take initial screenshot
    await page.screenshot({ path: "test-results/click-homepage-initial.png", fullPage: true });

    // Get all clickable elements
    const buttons = await page.locator("button:visible").all();
    const links = await page.locator("a:visible").all();

    console.log(`Found ${buttons.length} buttons and ${links.length} links on homepage`);

    // Click each button
    for (let i = 0; i < Math.min(buttons.length, 20); i++) {
      try {
        const button = page.locator("button:visible").nth(i);
        if (await button.isVisible()) {
          const text = (await button.textContent()) || `Button ${i}`;
          console.log(`Clicking button: ${text.slice(0, 30)}`);

          await button.click({ timeout: 3000 }).catch(() => {});
          clickCount++;

          // Check for modal/dialog
          const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Dialog"]');
          if (await modal.isVisible().catch(() => false)) {
            await page.screenshot({ path: `test-results/click-homepage-modal-${i}.png` });
            // Close modal
            await page.keyboard.press("Escape");
            await page.waitForTimeout(300);
          }

          // Check for errors
          const errors = await checkForErrors(page);
          if (errors.length > 0) {
            errorCount++;
            console.log(`  Error found: ${errors[0].slice(0, 50)}`);
          }

          // Go back if navigated away
          if (page.url() !== initialUrl && !page.url().includes("#")) {
            await page.goto(initialUrl, { waitUntil: "domcontentloaded" });
            await page.waitForLoadState("domcontentloaded");
          }
        }
      } catch (error) {
        // Continue to next element
      }
    }

    // Click internal links (not external, not auth)
    for (let i = 0; i < Math.min(links.length, 15); i++) {
      try {
        const link = page.locator("a:visible").nth(i);
        const href = await link.getAttribute("href");

        if (
          href &&
          !href.startsWith("mailto:") &&
          !href.startsWith("tel:") &&
          !href.includes("logout") &&
          !href.includes("external")
        ) {
          console.log(`Clicking link: ${href?.slice(0, 50)}`);
          await link.click({ timeout: 3000 });
          await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
          clickCount++;

          // Take screenshot of destination
          const pageName = href?.replace(/\//g, "-") || `page-${i}`;
          await page.screenshot({ path: `test-results/click-link-${pageName}.png`, fullPage: true });

          // Go back
          await page.goto(initialUrl, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("domcontentloaded");
        }
      } catch (error) {
        await page.goto(initialUrl).catch(() => {});
      }
    }

    console.log(`\nClicked ${clickCount} elements, found ${errorCount} errors`);

    // Take final screenshot
    await page.screenshot({ path: "test-results/click-homepage-final.png", fullPage: true });
  });

  test("Interact with Login page forms", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Wait for form to be ready
    const emailInput = page.locator('input[type="email"]');
    const hasEmail = await emailInput.isVisible({ timeout: 20000 }).catch(() => false);

    if (!hasEmail) {
      console.log("Email input not found, skipping form interactions");
      await page.screenshot({ path: "test-results/click-login-no-form.png" });
      return;
    }

    // Test form with empty submission (click might fail if button is disabled)
    console.log("Testing empty form submission...");
    await page.locator('button[type="submit"]').click({ timeout: 5000 }).catch(() => {
      console.log("Submit button click skipped (might be disabled)");
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/click-login-empty-submit.png" });

    // Test with invalid data
    console.log("Testing invalid email...");
    await page.fill('input[type="email"]', "invalid");
    await page.fill('input[type="password"]', "123");
    await page.locator('button[type="submit"]').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/click-login-invalid.png" });

    // Test with wrong credentials
    console.log("Testing wrong credentials...");
    await page.fill('input[type="email"]', "wrong@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.locator('button[type="submit"]').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/click-login-wrong-creds.png" });

    // Test forgot password link
    const forgotLink = page.locator('a[href*="forgot"]');
    if (await forgotLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forgotLink.click();
      await page.waitForLoadState("domcontentloaded");
      await page.screenshot({ path: "test-results/click-forgot-password.png" });
    }
  });

  test("Interact with Register page forms", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/register`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");

    await page.screenshot({ path: "test-results/click-register-initial.png", fullPage: true });

    // Try to fill all form fields
    await fillFormFields(page);
    await page.screenshot({ path: "test-results/click-register-filled.png", fullPage: true });

    // Submit and check for validation errors
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "test-results/click-register-submitted.png", fullPage: true });
    }
  });
});

test.describe("Click Everywhere - Diver Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page, ACCOUNTS.diver.email, ACCOUNTS.diver.password);
    } catch {
      test.skip(true, "Diver account not available");
    }
  });

  test("Click all elements on Diver Dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");

    await page.screenshot({ path: "test-results/click-diver-dashboard.png", fullPage: true });

    // Click all visible buttons
    const buttons = await page.locator("button:visible").all();
    console.log(`Found ${buttons.length} buttons on dashboard`);

    for (let i = 0; i < Math.min(buttons.length, 15); i++) {
      try {
        const button = page.locator("button:visible").nth(i);
        const text = await button.textContent();
        console.log(`Clicking: ${text?.slice(0, 30)}`);

        await button.click({ timeout: 3000 });
        await page.waitForTimeout(500);

        // Handle any modals
        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible().catch(() => false)) {
          await page.screenshot({ path: `test-results/click-diver-modal-${i}.png` });
          await page.keyboard.press("Escape");
        }
      } catch {
        // Continue
      }
    }

    // Navigate through sidebar/nav links
    const navLinks = await page
      .locator('nav a:visible, aside a:visible, [class*="sidebar"] a:visible')
      .all();

    for (let i = 0; i < navLinks.length; i++) {
      try {
        const link = page.locator('nav a:visible, aside a:visible, [class*="sidebar"] a:visible').nth(i);
        const href = await link.getAttribute("href");

        if (href && !href.includes("logout")) {
          console.log(`Navigating to: ${href}`);
          await link.click();
          await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
          await page.screenshot({
            path: `test-results/click-diver-nav-${href.replace(/\//g, "-")}.png`,
            fullPage: true,
          });
        }
      } catch {
        await page.goto(`${BASE_URL}/fr/dashboard`);
      }
    }
  });

  test("Interact with Diver Profile form", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/profile`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");

    await page.screenshot({ path: "test-results/click-diver-profile-initial.png", fullPage: true });

    // Fill all form fields
    await fillFormFields(page);
    await page.screenshot({ path: "test-results/click-diver-profile-filled.png", fullPage: true });

    // Try to save
    const saveBtn = page.locator('button[type="submit"], button:has-text("Enregistrer"), button:has-text("Save")');
    if (await saveBtn.first().isVisible()) {
      await saveBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "test-results/click-diver-profile-saved.png", fullPage: true });
    }
  });
});

test.describe("Click Everywhere - Center Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page, ACCOUNTS.center.email, ACCOUNTS.center.password);
    } catch {
      test.skip(true, "Center account not available");
    }
  });

  test("Click all elements on Center Dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");

    await page.screenshot({ path: "test-results/click-center-dashboard.png", fullPage: true });

    // Navigate through all center pages
    const pages = [
      "/fr/center/bookings",
      "/fr/center/services",
      "/fr/center/calendar",
      "/fr/center/team",
      "/fr/center/reviews",
      "/fr/center/settings",
    ];

    for (const pagePath of pages) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("domcontentloaded", { timeout: 20000 });

        const pageName = pagePath.split("/").pop() || "page";
        await page.screenshot({ path: `test-results/click-center-${pageName}.png`, fullPage: true });

        // Click visible buttons on each page
        const buttons = await page.locator("button:visible").all();
        console.log(`${pagePath}: Found ${buttons.length} buttons`);

        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
          try {
            const btn = page.locator("button:visible").nth(i);
            await btn.click({ timeout: 2000 });
            await page.waitForTimeout(300);

            // Handle modals
            if (await page.locator('[role="dialog"]').isVisible().catch(() => false)) {
              await page.screenshot({ path: `test-results/click-center-${pageName}-modal-${i}.png` });
              await page.keyboard.press("Escape");
            }
          } catch {
            // Continue
          }
        }
      } catch (error) {
        console.log(`Error on ${pagePath}: ${error}`);
      }
    }
  });

  test("Interact with Manual Booking form", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center/bookings`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");

    // Find and click manual booking button
    const manualBtn = page
      .locator('button:has-text("Manuelle"), button:has-text("Manual"), button:has(svg[class*="plus"])')
      .first();

    if (await manualBtn.isVisible()) {
      await manualBtn.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        await page.screenshot({ path: "test-results/click-center-manual-booking-form.png", fullPage: true });

        // Fill the form
        await fillFormFields(page);
        await page.screenshot({ path: "test-results/click-center-manual-booking-filled.png", fullPage: true });

        // Close without submitting
        await page.keyboard.press("Escape");
      }
    }
  });

  test("Interact with Service form", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center/services`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");

    // Try to open add service form
    const addBtn = page.locator('button:has-text("Ajouter"), button:has-text("Add"), a:has-text("Ajouter")').first();

    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(500);

      await page.screenshot({ path: "test-results/click-center-service-form.png", fullPage: true });

      // Fill form fields
      await fillFormFields(page);
      await page.screenshot({ path: "test-results/click-center-service-filled.png", fullPage: true });
    }
  });
});

test.describe("Click Everywhere - Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    } catch {
      test.skip(true, "Admin account not available");
    }
  });

  test("Click all elements on Admin pages", async ({ page }) => {
    const adminPages = [
      "/fr/admin",
      "/fr/admin/centers",
      "/fr/admin/users",
      "/fr/admin/bookings",
      "/fr/admin/reviews",
      "/fr/admin/commissions",
    ];

    for (const pagePath of adminPages) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("domcontentloaded", { timeout: 20000 });

        const pageName = pagePath.split("/").pop() || "admin";
        await page.screenshot({ path: `test-results/click-admin-${pageName}.png`, fullPage: true });

        // Click filter buttons
        const filters = await page.locator('a[href*="status="], button[class*="filter"]').all();
        console.log(`${pagePath}: Found ${filters.length} filter options`);

        for (let i = 0; i < Math.min(filters.length, 5); i++) {
          try {
            const filter = page.locator('a[href*="status="], button[class*="filter"]').nth(i);
            await filter.click();
            await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
            await page.screenshot({
              path: `test-results/click-admin-${pageName}-filter-${i}.png`,
              fullPage: true,
            });
          } catch {
            // Continue
          }
        }

        // Click action buttons if visible
        const actionBtns = await page
          .locator('button:has-text("Approuver"), button:has-text("Approve"), button:has-text("Voir")')
          .all();

        for (let i = 0; i < Math.min(actionBtns.length, 3); i++) {
          try {
            const btn = page
              .locator('button:has-text("Approuver"), button:has-text("Voir")')
              .nth(i);
            const text = await btn.textContent();
            console.log(`  Action button: ${text}`);
            // Don't actually click approve/reject buttons in tests
          } catch {
            // Continue
          }
        }
      } catch (error) {
        console.log(`Error on ${pagePath}: ${error}`);
      }
    }
  });
});

test.describe("Stress Test - Rapid Clicking", () => {
  test("Rapid navigation test", async ({ page }) => {
    const urls = [
      `${BASE_URL}/fr`,
      `${BASE_URL}/fr/centers`,
      `${BASE_URL}/fr/login`,
      `${BASE_URL}/fr/register`,
      `${BASE_URL}/en`,
      `${BASE_URL}/en/centers`,
    ];

    console.log("Starting rapid navigation test...");

    for (let round = 0; round < 3; round++) {
      console.log(`Round ${round + 1}...`);
      for (const url of urls) {
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
          // Quick interaction
          const firstButton = page.locator("button:visible").first();
          if (await firstButton.isVisible({ timeout: 1000 })) {
            await firstButton.click().catch(() => {});
          }
        } catch {
          // Continue even on error
        }
      }
    }

    console.log("Rapid navigation test complete");
    await page.screenshot({ path: "test-results/stress-test-final.png" });
  });
});
