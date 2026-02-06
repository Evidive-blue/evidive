import { test, expect } from "@playwright/test";

// Admin credentials from environment or defaults
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "tiktok@whytcard.ai";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Zerow1000!";

test.describe("Admin Panel Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto("/login");
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or admin
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
  });

  test("Admin dashboard loads correctly", async ({ page }) => {
    await page.goto("/admin");
    
    // Check page title
    await expect(page).toHaveTitle(/Admin Dashboard/);
    
    // Check main heading
    await expect(page.getByRole("heading", { name: /Admin Dashboard/ })).toBeVisible();
    
    // Check stats are visible
    await expect(page.getByText(/Total centers/i)).toBeVisible();
    await expect(page.getByText(/Total users/i)).toBeVisible();
    await expect(page.getByText(/Total bookings/i)).toBeVisible();
    
    // Screenshot for documentation
    await page.screenshot({ path: "tests/screenshots/admin/dashboard.png" });
  });

  test("Admin users page loads correctly", async ({ page }) => {
    await page.goto("/admin/users");
    
    // Check page loads without client-side errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    
    // Check no critical errors
    const criticalErrors = consoleErrors.filter(
      (e) => e.includes("Cannot read properties") || e.includes("TypeError")
    );
    expect(criticalErrors).toHaveLength(0);
    
    // Check page title or heading
    await expect(page.getByRole("heading", { name: /Gestion des utilisateurs|User Management/i })).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: "tests/screenshots/admin/users-list.png" });
  });

  test("Admin bookings page loads correctly", async ({ page }) => {
    await page.goto("/admin/bookings");
    
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "debug") {
        const text = msg.text();
        if (text.includes("TypeError") || text.includes("Cannot read properties")) {
          consoleErrors.push(text);
        }
      }
    });
    
    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    
    // Give time for client-side JS to execute
    await page.waitForTimeout(3000);
    
    // Check for client-side errors
    if (consoleErrors.length > 0) {
      console.error("Client-side errors found:", consoleErrors);
    }
    expect(consoleErrors).toHaveLength(0);
    
    // Check page content
    await expect(page.getByRole("heading", { name: /Gestion des réservations|Bookings Management/i })).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: "tests/screenshots/admin/bookings-list.png" });
  });

  test("Admin centers page loads correctly", async ({ page }) => {
    await page.goto("/admin/centers");
    
    // Check page loads
    await page.waitForLoadState("networkidle");
    
    // Check heading
    await expect(page.getByRole("heading", { name: /Gestion des centres|Centers Management/i })).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: "tests/screenshots/admin/centers-list.png" });
  });

  test("Admin can view user details", async ({ page }) => {
    // First go to users list
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    
    // Wait for user list to load
    await page.waitForTimeout(2000);
    
    // Click on first user details link if available
    const detailsLink = page.getByRole("link", { name: /Détails|Details/i }).first();
    if (await detailsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailsLink.click();
      
      // Wait for navigation
      await page.waitForURL(/\/admin\/users\/[a-z0-9-]+/, { timeout: 10000 });
      
      // Check user detail page loads
      await page.waitForLoadState("networkidle");
      
      await page.screenshot({ path: "tests/screenshots/admin/user-detail.png" });
    }
  });

  test("Admin can view booking details", async ({ page }) => {
    // First go to bookings list
    await page.goto("/admin/bookings");
    await page.waitForLoadState("networkidle");
    
    // Wait for bookings to load
    await page.waitForTimeout(2000);
    
    // Check if there are any bookings
    const bookingCount = page.getByText(/réservations? au total/i);
    const countText = await bookingCount.textContent();
    
    if (countText && !countText.includes("0")) {
      // Click on first booking if available
      const detailsLink = page.getByRole("link", { name: /Détails|Details/i }).first();
      if (await detailsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await detailsLink.click();
        
        // Wait for navigation
        await page.waitForURL(/\/admin\/bookings\/[a-z0-9-]+/, { timeout: 10000 });
        
        // Check booking detail page loads
        await page.waitForLoadState("networkidle");
        
        await page.screenshot({ path: "tests/screenshots/admin/booking-detail.png" });
      }
    }
  });

  test("Admin quick actions are clickable", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    
    // Check quick action links exist and are clickable
    const manageUsersLink = page.getByRole("link", { name: /manageUsers|Gérer les utilisateurs/i });
    await expect(manageUsersLink).toBeVisible({ timeout: 10000 });
    
    const viewBookingsLink = page.getByRole("link", { name: /viewBookings|Voir les réservations/i });
    await expect(viewBookingsLink).toBeVisible({ timeout: 10000 });
    
    const manageCentersLink = page.getByRole("link", { name: /manageCenters|Gérer les centres/i });
    await expect(manageCentersLink).toBeVisible({ timeout: 10000 });
  });
});
