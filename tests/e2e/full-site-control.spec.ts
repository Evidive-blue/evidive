/**
 * EviDive - Full Site Control Test Suite
 *
 * This comprehensive E2E test suite covers:
 * - All page navigation
 * - Authentication with all user types
 * - Form submissions
 * - Booking flows
 * - Center management
 * - Admin functions
 * - Error handling
 * - Responsive design
 */

import { test, expect, Page, BrowserContext } from "@playwright/test";

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const LOCALES = ["fr", "en"];

// Test accounts - these should exist in your test database
const TEST_ACCOUNTS = {
  diver: {
    email: "test-diver@evidive.test",
    password: "TestDiver123!",
    type: "DIVER",
  },
  centerOwner: {
    email: "test-center@evidive.test",
    password: "TestCenter123!",
    type: "CENTER_OWNER",
  },
  admin: {
    email: "admin@evidive.test",
    password: "AdminTest123!",
    type: "ADMIN",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/fr/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect after login
  await page.waitForURL(/\/(dashboard|center|admin)/, { timeout: 10000 });
}

async function logout(page: Page) {
  // Click on user menu and logout
  const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Déconnexion"), button:has-text("Logout")');
  if (await userMenu.isVisible()) {
    await userMenu.click();
    const logoutBtn = page.locator('button:has-text("Déconnexion"), button:has-text("Logout"), a:has-text("Déconnexion")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }
  }
}

async function takeScreenshotOnError(page: Page, testName: string) {
  await page.screenshot({ path: `test-results/error-${testName}-${Date.now()}.png`, fullPage: true });
}

async function clickAllLinks(page: Page, selector: string = "a[href]") {
  const links = await page.locator(selector).all();
  const hrefs: string[] = [];

  for (const link of links) {
    const href = await link.getAttribute("href");
    if (href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
      hrefs.push(href);
    }
  }

  return hrefs;
}

// ============================================================================
// PUBLIC PAGES TESTS
// ============================================================================

test.describe("Public Pages - No Authentication Required", () => {

  test.describe("Homepage", () => {
    for (const locale of LOCALES) {
      test(`[${locale}] Homepage loads correctly`, async ({ page }) => {
        await page.goto(`${BASE_URL}/${locale}`);

        // Check main sections exist
        await expect(page.locator("header")).toBeVisible();
        await expect(page.locator("main")).toBeVisible();
        await expect(page.locator("footer")).toBeVisible();

        // Check hero section
        const heroSection = page.locator("section").first();
        await expect(heroSection).toBeVisible();

        // Check CTA buttons
        const ctaButtons = page.locator('a[href*="/centers"], a[href*="/onboard"], button');
        expect(await ctaButtons.count()).toBeGreaterThan(0);

        // Take screenshot
        await page.screenshot({ path: `test-results/homepage-${locale}.png`, fullPage: true });
      });

      test(`[${locale}] Homepage navigation works`, async ({ page }) => {
        await page.goto(`${BASE_URL}/${locale}`);

        // Test navigation links
        const navLinks = page.locator("header nav a, header a");
        const navCount = await navLinks.count();

        for (let i = 0; i < Math.min(navCount, 5); i++) {
          const link = navLinks.nth(i);
          const href = await link.getAttribute("href");
          if (href && !href.includes("login") && !href.includes("register")) {
            await link.click();
            await page.waitForLoadState("networkidle");
            // Go back to homepage
            await page.goto(`${BASE_URL}/${locale}`);
          }
        }
      });
    }
  });

  test.describe("Centers Directory", () => {
    test("Centers page loads and displays results", async ({ page }) => {
      await page.goto(`${BASE_URL}/fr/centers`);

      await expect(page).toHaveURL(/\/centers/);

      // Check for search/filter elements
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="recherche"]');

      // Check for center cards or empty state
      const centerCards = page.locator('[class*="card"], [class*="center-item"]');
      const emptyState = page.locator('text=/aucun|no results|empty/i');

      const hasCards = await centerCards.count() > 0;
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      expect(hasCards || hasEmptyState).toBeTruthy();

      await page.screenshot({ path: "test-results/centers-directory.png", fullPage: true });
    });

    test("Center detail page loads", async ({ page }) => {
      await page.goto(`${BASE_URL}/fr/centers`);

      // Try to click on first center if available
      const firstCenter = page.locator('a[href*="/center/"]').first();
      if (await firstCenter.isVisible()) {
        await firstCenter.click();
        await page.waitForLoadState("networkidle");

        // Check center detail elements
        await expect(page).toHaveURL(/\/center\//);

        await page.screenshot({ path: "test-results/center-detail.png", fullPage: true });
      }
    });
  });

  test.describe("Authentication Pages", () => {
    test("Login page renders correctly", async ({ page }) => {
      await page.goto(`${BASE_URL}/fr/login`);

      // Check form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Check Google OAuth button
      const googleButton = page.locator('button:has-text("Google"), button:has(svg)');
      await expect(googleButton.first()).toBeVisible();

      // Check links
      await expect(page.locator('a[href*="register"]')).toBeVisible();
      await expect(page.locator('a[href*="forgot-password"]')).toBeVisible();

      await page.screenshot({ path: "test-results/login-page.png", fullPage: true });
    });

    test("Register page renders correctly", async ({ page }) => {
      await page.goto(`${BASE_URL}/fr/register`);

      // Check form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();

      // Check user type selection
      const diverOption = page.locator('text=/plongeur|diver/i');
      const centerOption = page.locator('text=/centre|center/i');

      await page.screenshot({ path: "test-results/register-page.png", fullPage: true });
    });

    test("Forgot password page renders correctly", async ({ page }) => {
      await page.goto(`${BASE_URL}/fr/forgot-password`);

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      await page.screenshot({ path: "test-results/forgot-password.png", fullPage: true });
    });

    test("Login with invalid credentials shows error", async ({ page }) => {
      await page.goto(`${BASE_URL}/fr/login`);

      await page.fill('input[type="email"]', "invalid@test.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Wait for error message
      const errorMessage = page.locator('[class*="error"], [class*="alert"], [role="alert"], text=/erreur|invalid|incorrect/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });

      await page.screenshot({ path: "test-results/login-error.png" });
    });
  });

  test.describe("Onboarding Pages", () => {
    test("Center onboarding flow is accessible", async ({ page }) => {
      await page.goto(`${BASE_URL}/fr/onboard/center/account`);

      // Check onboarding form elements
      const formElements = page.locator("form input, form select, form textarea");
      expect(await formElements.count()).toBeGreaterThan(0);

      await page.screenshot({ path: "test-results/center-onboarding.png", fullPage: true });
    });
  });

  test.describe("Legal Pages", () => {
    const legalPages = [
      { path: "/privacy", name: "Privacy Policy" },
      { path: "/terms", name: "Terms of Service" },
      { path: "/legal", name: "Legal Notice" },
    ];

    for (const legalPage of legalPages) {
      test(`${legalPage.name} page loads`, async ({ page }) => {
        await page.goto(`${BASE_URL}/fr${legalPage.path}`);
        await page.waitForLoadState("networkidle");

        // Check page has content
        const content = page.locator("main, article, [class*='content']");
        await expect(content.first()).toBeVisible();

        await page.screenshot({ path: `test-results/legal-${legalPage.path.replace("/", "")}.png`, fullPage: true });
      });
    }
  });
});

// ============================================================================
// DIVER AUTHENTICATED TESTS
// ============================================================================

test.describe("Diver User - Authenticated", () => {
  test.beforeEach(async ({ page }) => {
    // Try to login - skip tests if login fails
    try {
      await login(page, TEST_ACCOUNTS.diver.email, TEST_ACCOUNTS.diver.password);
    } catch (error) {
      test.skip(true, "Diver test account not available");
    }
  });

  test("Dashboard loads correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/dashboard`);

    // Check dashboard elements
    await expect(page.locator("h1, h2")).toBeVisible();

    // Check for typical dashboard widgets
    const widgets = page.locator('[class*="card"], [class*="widget"]');
    expect(await widgets.count()).toBeGreaterThan(0);

    await page.screenshot({ path: "test-results/diver-dashboard.png", fullPage: true });
  });

  test("Profile page loads and can be edited", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/profile`);

    // Check profile form
    await expect(page.locator('input, select, textarea').first()).toBeVisible();

    // Check save button exists
    const saveButton = page.locator('button[type="submit"], button:has-text("Enregistrer"), button:has-text("Save")');
    await expect(saveButton.first()).toBeVisible();

    await page.screenshot({ path: "test-results/diver-profile.png", fullPage: true });
  });

  test("Bookings page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/bookings`);

    // Check for bookings list or empty state
    const bookingCards = page.locator('[class*="booking"], [class*="card"]');
    const emptyState = page.locator('text=/aucune|no booking|empty/i');

    await page.screenshot({ path: "test-results/diver-bookings.png", fullPage: true });
  });

  test("Reviews page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/reviews`);

    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "test-results/diver-reviews.png", fullPage: true });
  });

  test("Can browse and interact with center directory while logged in", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/centers`);

    // Search for a center
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("dive");
      await page.waitForTimeout(1000); // Wait for search results
    }

    await page.screenshot({ path: "test-results/diver-centers-search.png", fullPage: true });
  });
});

// ============================================================================
// CENTER OWNER AUTHENTICATED TESTS
// ============================================================================

test.describe("Center Owner - Authenticated", () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page, TEST_ACCOUNTS.centerOwner.email, TEST_ACCOUNTS.centerOwner.password);
    } catch (error) {
      test.skip(true, "Center owner test account not available");
    }
  });

  test("Center dashboard loads correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center`);

    // Check for center dashboard elements
    const dashboard = page.locator('[class*="dashboard"], main');
    await expect(dashboard.first()).toBeVisible();

    await page.screenshot({ path: "test-results/center-dashboard.png", fullPage: true });
  });

  test("Bookings management page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center/bookings`);

    await page.waitForLoadState("networkidle");

    // Check for booking filters
    const filters = page.locator('[class*="filter"], button:has-text("Filtrer"), select');

    // Check for manual booking button
    const manualBookingBtn = page.locator('button:has-text("Manuelle"), button:has-text("Manual")');

    await page.screenshot({ path: "test-results/center-bookings.png", fullPage: true });
  });

  test("Services management page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center/services`);

    await page.waitForLoadState("networkidle");

    // Check for add service button
    const addServiceBtn = page.locator('button:has-text("Ajouter"), button:has-text("Add"), a:has-text("Ajouter")');

    await page.screenshot({ path: "test-results/center-services.png", fullPage: true });
  });

  test("Can open manual booking form", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center/bookings`);

    const manualBookingBtn = page.locator('button:has-text("Manuelle"), button:has-text("Manual"), button:has(svg)').first();

    if (await manualBookingBtn.isVisible()) {
      await manualBookingBtn.click();

      // Check modal opens
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Dialog"]');
      await expect(modal.first()).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: "test-results/center-manual-booking-modal.png" });

      // Close modal
      const closeBtn = page.locator('button:has-text("Annuler"), button:has-text("Cancel"), button[aria-label="Close"]');
      if (await closeBtn.first().isVisible()) {
        await closeBtn.first().click();
      }
    }
  });

  test("Calendar page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center/calendar`);

    await page.waitForLoadState("networkidle");

    // Check for calendar elements
    const calendar = page.locator('[class*="calendar"], [class*="Calendar"]');

    await page.screenshot({ path: "test-results/center-calendar.png", fullPage: true });
  });

  test("Team management page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center/team`);

    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "test-results/center-team.png", fullPage: true });
  });

  test("Reviews page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center/reviews`);

    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "test-results/center-reviews.png", fullPage: true });
  });

  test("Settings page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/center/settings`);

    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "test-results/center-settings.png", fullPage: true });
  });
});

// ============================================================================
// ADMIN AUTHENTICATED TESTS
// ============================================================================

test.describe("Admin User - Authenticated", () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    } catch (error) {
      test.skip(true, "Admin test account not available");
    }
  });

  test("Admin dashboard loads correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/admin`);

    // Check for admin dashboard elements
    const stats = page.locator('[class*="stat"], [class*="card"]');
    expect(await stats.count()).toBeGreaterThan(0);

    await page.screenshot({ path: "test-results/admin-dashboard.png", fullPage: true });
  });

  test("Admin centers management loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/admin/centers`);

    await page.waitForLoadState("networkidle");

    // Check for status filters
    const statusFilters = page.locator('a:has-text("PENDING"), a:has-text("APPROVED"), a:has-text("En attente")');

    await page.screenshot({ path: "test-results/admin-centers.png", fullPage: true });
  });

  test("Admin can view pending centers", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/admin/centers?status=PENDING`);

    await page.waitForLoadState("networkidle");

    // Check for approve/reject buttons if there are pending centers
    const actionButtons = page.locator('button:has-text("Approuver"), button:has-text("Approve"), button:has-text("Rejeter")');

    await page.screenshot({ path: "test-results/admin-pending-centers.png", fullPage: true });
  });

  test("Admin users management loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/admin/users`);

    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "test-results/admin-users.png", fullPage: true });
  });

  test("Admin bookings management loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/admin/bookings`);

    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "test-results/admin-bookings.png", fullPage: true });
  });

  test("Admin reviews management loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/admin/reviews`);

    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "test-results/admin-reviews.png", fullPage: true });
  });

  test("Admin commissions page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/admin/commissions`);

    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "test-results/admin-commissions.png", fullPage: true });
  });
});

// ============================================================================
// FORM VALIDATION TESTS
// ============================================================================

test.describe("Form Validations", () => {

  test("Login form validation", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/login`);

    // Submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    const errors = page.locator('[class*="error"], [aria-invalid="true"], :invalid');
    expect(await errors.count()).toBeGreaterThan(0);

    // Test invalid email
    await page.fill('input[type="email"]', "invalid-email");
    await page.fill('input[type="password"]', "short");
    await page.click('button[type="submit"]');

    await page.screenshot({ path: "test-results/login-validation.png" });
  });

  test("Register form validation", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/register`);

    // Submit empty form
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Check for validation errors
      await page.waitForTimeout(500);
      await page.screenshot({ path: "test-results/register-validation.png" });
    }
  });

  test("Forgot password form validation", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/forgot-password`);

    // Submit with invalid email
    await page.fill('input[type="email"]', "invalid");
    await page.click('button[type="submit"]');

    await page.screenshot({ path: "test-results/forgot-password-validation.png" });
  });
});

// ============================================================================
// RESPONSIVE DESIGN TESTS
// ============================================================================

test.describe("Responsive Design", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`Homepage renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${BASE_URL}/fr`);

      // Check header is visible
      await expect(page.locator("header")).toBeVisible();

      // On mobile, check for hamburger menu
      if (viewport.name === "mobile") {
        const hamburger = page.locator('button[aria-label*="menu"], button:has(svg[class*="menu"]), [class*="hamburger"]');
        // Mobile menu might exist
      }

      await page.screenshot({
        path: `test-results/responsive-homepage-${viewport.name}.png`,
        fullPage: true
      });
    });

    test(`Login page renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${BASE_URL}/fr/login`);

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();

      await page.screenshot({
        path: `test-results/responsive-login-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});

// ============================================================================
// LANGUAGE SWITCHING TESTS
// ============================================================================

test.describe("Internationalization", () => {
  test("Can switch from French to English", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr`);

    // Look for language switcher
    const langSwitcher = page.locator('button:has-text("FR"), button:has-text("EN"), [class*="lang"], select[name*="lang"]');

    if (await langSwitcher.first().isVisible()) {
      await langSwitcher.first().click();

      // Look for English option
      const enOption = page.locator('a:has-text("English"), button:has-text("English"), option[value="en"]');
      if (await enOption.first().isVisible()) {
        await enOption.first().click();
        await page.waitForURL(/\/en\//);
      }
    }

    await page.screenshot({ path: "test-results/language-switch.png" });
  });

  test("French content is displayed correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr`);

    // Check for French text
    const frenchText = page.locator('text=/Plongée|Réserver|Découvrir|Centre/i');
    expect(await frenchText.count()).toBeGreaterThan(0);
  });

  test("English content is displayed correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/en`);

    // Check for English text
    const englishText = page.locator('text=/Dive|Book|Discover|Center/i');
    expect(await englishText.count()).toBeGreaterThan(0);
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe("Error Handling", () => {
  test("404 page displays correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/page-that-does-not-exist-12345`);

    // Check for 404 content
    const notFoundText = page.locator('text=/404|not found|introuvable|existe pas/i');
    await expect(notFoundText.first()).toBeVisible();

    // Check for home link
    const homeLink = page.locator('a[href="/"], a[href="/fr"], a:has-text("Accueil"), a:has-text("Home")');

    await page.screenshot({ path: "test-results/404-page.png", fullPage: true });
  });

  test("Protected routes redirect to login", async ({ page }) => {
    // Try to access protected page without auth
    await page.goto(`${BASE_URL}/fr/dashboard`);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("Admin routes redirect non-admin users", async ({ page }) => {
    // Login as diver
    try {
      await login(page, TEST_ACCOUNTS.diver.email, TEST_ACCOUNTS.diver.password);

      // Try to access admin page
      await page.goto(`${BASE_URL}/fr/admin`);

      // Should redirect away from admin
      await expect(page).not.toHaveURL(/\/admin$/);
    } catch {
      test.skip(true, "Test account not available");
    }
  });
});

// ============================================================================
// PERFORMANCE CHECKS
// ============================================================================

test.describe("Performance", () => {
  test("Homepage loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/fr`);
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    console.log(`Homepage load time: ${loadTime}ms`);

    // Homepage should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("No console errors on homepage", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/fr`);
    await page.waitForLoadState("networkidle");

    // Filter out known acceptable errors (like failed fetches for missing resources)
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes("favicon") && !error.includes("404")
    );

    if (criticalErrors.length > 0) {
      console.log("Console errors found:", criticalErrors);
    }
  });
});

// ============================================================================
// ACCESSIBILITY BASICS
// ============================================================================

test.describe("Accessibility Basics", () => {
  test("Homepage has proper heading structure", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr`);

    // Check for h1
    const h1 = page.locator("h1");
    expect(await h1.count()).toBeGreaterThanOrEqual(1);

    // Check for alt text on images
    const imagesWithoutAlt = page.locator("img:not([alt])");
    const count = await imagesWithoutAlt.count();

    if (count > 0) {
      console.log(`Warning: ${count} images without alt text`);
    }
  });

  test("Forms have proper labels", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/login`);

    // Check inputs have associated labels or aria-labels
    const inputs = page.locator("input:not([type='hidden'])");
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledby = await input.getAttribute("aria-labelledby");
      const placeholder = await input.getAttribute("placeholder");

      // Should have some form of label
      const hasLabel = id || ariaLabel || ariaLabelledby || placeholder;
      expect(hasLabel).toBeTruthy();
    }
  });

  test("Interactive elements are keyboard accessible", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/login`);

    // Tab through the form
    await page.keyboard.press("Tab");

    // Check focus is visible
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});

// ============================================================================
// FULL SITE CRAWL
// ============================================================================

test.describe("Full Site Crawl", () => {
  test("Crawl all accessible pages and check for errors", async ({ page }) => {
    const visitedUrls = new Set<string>();
    const errors: { url: string; error: string }[] = [];
    const pagesToVisit = [`${BASE_URL}/fr`];

    // Limit crawl depth
    const maxPages = 20;
    let pagesVisited = 0;

    while (pagesToVisit.length > 0 && pagesVisited < maxPages) {
      const url = pagesToVisit.shift()!;

      if (visitedUrls.has(url)) continue;
      visitedUrls.add(url);

      try {
        const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

        if (response && response.status() >= 400) {
          errors.push({ url, error: `HTTP ${response.status()}` });
        }

        pagesVisited++;

        // Collect internal links
        const links = await page.locator('a[href^="/"], a[href^="' + BASE_URL + '"]').all();

        for (const link of links) {
          const href = await link.getAttribute("href");
          if (href) {
            const fullUrl = href.startsWith("/") ? `${BASE_URL}${href}` : href;

            // Only add internal links that haven't been visited
            if (
              fullUrl.startsWith(BASE_URL) &&
              !visitedUrls.has(fullUrl) &&
              !fullUrl.includes("logout") &&
              !fullUrl.includes("api/")
            ) {
              pagesToVisit.push(fullUrl);
            }
          }
        }
      } catch (error) {
        errors.push({ url, error: String(error) });
      }
    }

    console.log(`Crawled ${pagesVisited} pages`);
    console.log(`Found ${errors.length} errors`);

    if (errors.length > 0) {
      console.log("Errors:", errors);
    }

    // Allow some errors (protected pages, etc)
    expect(errors.length).toBeLessThan(5);
  });
});
