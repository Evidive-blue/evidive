# EviDive E2E Test Suite

## 📋 Overview

This test suite provides comprehensive end-to-end testing for the EviDive platform using Playwright.

## 🚀 Quick Start

```bash
# 1. Install Playwright browsers (first time only)
pnpm exec playwright install

# 2. Seed test accounts in database
pnpm db:seed-test

# 3. Run all tests
pnpm test:e2e
```

## 📁 Test Files

| File | Description |
|------|-------------|
| `full-site-control.spec.ts` | Complete test suite covering all pages, auth, forms |
| `click-everywhere.spec.ts` | Interactive test that clicks all elements and fills forms |

## 🎯 Test Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Run with visible browser
pnpm test:e2e:headed

# Run with Playwright UI (interactive)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug

# Run only Chrome tests
pnpm test:e2e:chromium

# View HTML report after tests
pnpm test:e2e:report
```

## 👤 Test Accounts

Before running tests, seed the test accounts:

```bash
pnpm db:seed-test
```

This creates:

| Type | Email | Password |
|------|-------|----------|
| Diver | test-diver@evidive.test | TestDiver123! |
| Center Owner | test-center@evidive.test | TestCenter123! |
| Admin | admin@evidive.test | AdminTest123! |

## 📊 Test Coverage

### Public Pages
- ✅ Homepage (FR/EN)
- ✅ Centers directory
- ✅ Center detail page
- ✅ Login page
- ✅ Register page
- ✅ Forgot password
- ✅ Onboarding pages
- ✅ Legal pages (Privacy, Terms, Legal)
- ✅ 404 page

### Authentication
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Form validation
- ✅ OAuth button visibility
- ✅ Protected route redirects

### Diver Features
- ✅ Dashboard
- ✅ Profile page (view/edit)
- ✅ Bookings list
- ✅ Reviews page
- ✅ Browse centers while logged in

### Center Owner Features
- ✅ Center dashboard
- ✅ Bookings management
- ✅ Manual booking form
- ✅ Services management
- ✅ Calendar view
- ✅ Team management
- ✅ Reviews management
- ✅ Settings page

### Admin Features
- ✅ Admin dashboard
- ✅ Centers management
- ✅ Pending center approvals
- ✅ Users management
- ✅ Bookings overview
- ✅ Reviews moderation
- ✅ Commissions page

### Quality Checks
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Internationalization (FR/EN)
- ✅ Form validation
- ✅ Performance (load time)
- ✅ Accessibility basics
- ✅ Console error detection
- ✅ Full site crawl

## 🔧 Configuration

Edit `playwright.config.ts` to customize:
- Base URL
- Browsers to test
- Timeouts
- Reporters
- Screenshot/video settings

## 📸 Test Results

After running tests:
- Screenshots: `test-results/*.png`
- HTML Report: `playwright-report/index.html`
- JSON Results: `test-results/results.json`
- Videos (on failure): `test-results/`

## 🐛 Debugging

```bash
# Run single test file
pnpm exec playwright test full-site-control.spec.ts

# Run single test by name
pnpm exec playwright test -g "Homepage loads correctly"

# Debug mode with inspector
pnpm test:e2e:debug

# Generate trace for debugging
PWDEBUG=1 pnpm test:e2e
```

## ⚡ Tips

1. **First Run**: Install browsers with `pnpm exec playwright install`
2. **Speed**: Use `--project=chromium` to run only one browser
3. **Headless Issues**: Use `--headed` to see what's happening
4. **Flaky Tests**: Increase timeouts in config if needed
5. **CI/CD**: Set `CI=true` for stricter settings

## 📝 Writing New Tests

```typescript
import { test, expect } from "@playwright/test";

test("My new test", async ({ page }) => {
  await page.goto("/fr/my-page");
  await expect(page.locator("h1")).toContainText("Expected Title");

  // Interact with elements
  await page.click("button");
  await page.fill("input", "value");

  // Take screenshot
  await page.screenshot({ path: "test-results/my-test.png" });
});
```

## 🔗 Resources

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Locator Strategies](https://playwright.dev/docs/locators)
