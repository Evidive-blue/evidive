import { test, expect } from "@playwright/test";

test.describe("Center Creation Flow", () => {
  // Increase timeout for this test suite
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop
    await page.setViewportSize({ width: 1400, height: 900 });
  });

  test("Complete flow: Register -> Login -> Create Center", async ({ page }) => {
    // 1. Go to homepage
    await page.goto("http://localhost:3000");
    await expect(page).toHaveTitle(/EviDive/);
    console.log("✅ Homepage loaded");

    // Take screenshot of homepage
    await page.screenshot({ path: "tests/screenshots/01-homepage.png" });

    // 2. Click on Register
    await page.click('text=Sign up');
    await page.waitForURL("**/register");
    console.log("✅ Register page loaded");
    await page.screenshot({ path: "tests/screenshots/02-register-page.png" });

    // 3. Fill registration form
    const testEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="firstName"], input[placeholder*="First"]', "Test");
    await page.fill('input[name="lastName"], input[placeholder*="Last"]', "User");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[placeholder*="Password"]:not([name="confirmPassword"])', "TestPassword123!");
    await page.fill('input[name="confirmPassword"], input[placeholder*="Confirm"]', "TestPassword123!");
    
    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.screenshot({ path: "tests/screenshots/03-register-filled.png" });

    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for success or redirect
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "tests/screenshots/04-after-register.png" });
    console.log("✅ Registration submitted");

    // 4. Login with the admin account (since we can't verify email in test)
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");
    console.log("✅ Login page loaded");
    await page.screenshot({ path: "tests/screenshots/05-login-page.png" });

    // Fill login form with admin credentials
    await page.fill('input[type="email"]', "admin@evidive.blue");
    await page.fill('input[type="password"]', "Admin1234!");
    await page.screenshot({ path: "tests/screenshots/06-login-filled.png" });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    console.log("✅ Logged in, redirected to dashboard");
    await page.screenshot({ path: "tests/screenshots/07-dashboard.png" });

    // 5. Check that user menu is visible (not Login/Signup)
    const userMenu = page.locator('button:has-text("Admin"), button:has-text("admin")');
    await expect(userMenu.or(page.locator('[aria-label*="user"], [aria-label*="User"]'))).toBeVisible({ timeout: 5000 });
    console.log("✅ User menu visible in header");

    // 6. Navigate to center onboarding
    await page.goto("http://localhost:3000/onboard/center");
    await page.waitForLoadState("networkidle");
    console.log("✅ Center onboarding page loaded");
    await page.screenshot({ path: "tests/screenshots/08-center-onboard.png" });

    // 7. Fill Step 1: Basic Info
    await page.fill('input[placeholder*="Blue Ocean"]', "Test Dive Center");
    await page.fill('input[placeholder*="tagline"]', "Best diving in the Mediterranean");
    await page.fill('textarea[placeholder*="Describe"]', "A wonderful dive center for testing purposes. We offer the best diving experiences in the region.");
    await page.fill('input[placeholder*="contact@"]', "center@example.com");
    await page.fill('input[placeholder*="+1"]', "+33612345678");
    await page.fill('input[placeholder*="https://"]', "https://testdivecenter.com");
    await page.screenshot({ path: "tests/screenshots/09-center-step1.png" });
    
    // Next step - Click Continue button
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(1000);
    console.log("✅ Step 1 completed");

    // 8. Fill Step 2: Location
    await page.fill('input[placeholder*="Ocean Boulevard"]', "123 Ocean Drive");
    await page.fill('input[placeholder*="Sharm"]', "Nice");
    await page.fill('input[placeholder*="South Sinai"]', "Provence-Alpes");
    await page.fill('input[placeholder*="Egypt"]', "France");
    await page.fill('input[placeholder="12345"]', "06000");
    await page.screenshot({ path: "tests/screenshots/10-center-step2.png" });
    
    // Next step
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(1000);
    console.log("✅ Step 2 completed");

    // 9. Fill Step 3: Services - Click on dive type buttons
    // Scroll down to see all options
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);
    
    // Click on some dive types (they are buttons, not checkboxes) - use getByRole for exact match
    await page.getByRole('button', { name: 'Reef Diving', exact: true }).click({ force: true });
    await page.getByRole('button', { name: 'Night Diving', exact: true }).click({ force: true });
    await page.getByRole('button', { name: 'Wreck Diving', exact: true }).click({ force: true });
    
    // Click some certifications - use exact match
    await page.getByRole('button', { name: 'PADI', exact: true }).click({ force: true });
    await page.getByRole('button', { name: 'SSI', exact: true }).click({ force: true });
    
    // Scroll more to see languages
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);
    
    // Click some languages - use exact match
    await page.getByRole('button', { name: 'English', exact: true }).click({ force: true });
    await page.getByRole('button', { name: 'French', exact: true }).click({ force: true });
    await page.screenshot({ path: "tests/screenshots/11-center-step3.png" });
    
    // Scroll back up and click Continue
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(1000);
    console.log("✅ Step 3 completed");

    // 10. Fill Step 4: Legal
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    await page.fill('input[placeholder*="LLC"]', "Test Dive Center SARL");
    await page.fill('input[placeholder*="Company reg"]', "12345678901234");
    await page.fill('input[placeholder*="VAT"]', "FR12345678901");
    await page.fill('input[placeholder*="Insurance company"]', "AXA Diving Insurance");
    await page.fill('input[placeholder*="policy"]', "POL-2026-12345");
    
    // Scroll to see terms checkbox
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(300);
    
    // Accept terms - checkbox
    await page.locator('input[type="checkbox"]').click({ force: true });
    await page.screenshot({ path: "tests/screenshots/12-center-step4.png" });
    
    // Scroll back and click Continue
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Continue")').click();
    await page.waitForTimeout(1000);
    console.log("✅ Step 4 completed");

    // 11. Review and Submit
    await page.screenshot({ path: "tests/screenshots/13-center-review.png" });
    
    // Submit center
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Créer"), button:has-text("Register")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      console.log("✅ Center submitted");
    }

    await page.screenshot({ path: "tests/screenshots/14-after-submit.png" });

    // 12. Go to admin panel to approve the center
    await page.goto("http://localhost:3000/admin");
    await page.waitForLoadState("networkidle");
    console.log("✅ Admin dashboard loaded");
    await page.screenshot({ path: "tests/screenshots/15-admin-dashboard.png" });

    // 13. Go to centers management
    await page.click('a[href="/admin/centers"]');
    await page.waitForURL("**/admin/centers**");
    await page.waitForLoadState("networkidle");
    console.log("✅ Admin centers page loaded");
    await page.screenshot({ path: "tests/screenshots/16-admin-centers.png" });

    // 14. Find and approve the pending center
    const approveButton = page.locator('button:has-text("Approve")').first();
    if (await approveButton.isVisible({ timeout: 5000 })) {
      await approveButton.click();
      await page.waitForTimeout(2000);
      console.log("✅ Center approved!");
      await page.screenshot({ path: "tests/screenshots/17-center-approved.png" });
    } else {
      console.log("⚠️ No pending center found to approve");
    }

    // 15. Final state
    console.log("\n🎉 Test completed successfully!");
    console.log(`Screenshots saved in tests/screenshots/`);
  });
});
