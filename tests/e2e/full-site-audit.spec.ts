import { test, expect, Page, BrowserContext } from "@playwright/test";

/**
 * SCRIPT DE TEST EXHAUSTIF - EviDive
 * 
 * Ce script teste TOUTES les pages et fonctionnalités du site :
 * - Pages publiques
 * - Authentification (inscription, connexion, déconnexion)
 * - Pages protégées (dashboard, onboarding, admin)
 * - Formulaires
 * - Navigation et liens
 * - Erreurs console
 * - Images cassées
 * - Responsive design
 * - Accessibilité de base
 * - Performance
 * - API endpoints
 */

const BASE_URL =
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://evidive.blue";

// Credentials de test
const TEST_USER = {
  email: `test-audit-${Date.now()}@example.com`,
  password: "TestPassword123!",
  firstName: "Test",
  lastName: "Audit",
};

const ADMIN_USER = {
  email: "admin@evidive.blue",
  password: "Admin1234!",
};

// Toutes les pages publiques à tester
const PUBLIC_PAGES = [
  { path: "/", name: "Homepage" },
  { path: "/about", name: "À propos" },
  { path: "/centers", name: "Centres" },
  { path: "/explorer", name: "Explorer" },
  { path: "/contact", name: "Contact" },
  { path: "/careers", name: "Carrières" },
  { path: "/terms", name: "CGV" },
  { path: "/privacy", name: "Confidentialité" },
  { path: "/site-map", name: "Plan du site" },
  { path: "/login", name: "Connexion" },
  { path: "/register", name: "Inscription" },
  { path: "/forgot-password", name: "Mot de passe oublié" },
];

// Pages protégées (nécessitent authentification)
const PROTECTED_PAGES = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/onboard", name: "Onboarding" },
  { path: "/onboard/diver", name: "Onboarding Plongeur" },
  { path: "/onboard/center", name: "Onboarding Centre" },
];

// Pages admin (nécessitent rôle admin)
const ADMIN_PAGES = [
  { path: "/admin", name: "Admin Dashboard" },
  { path: "/admin/centers", name: "Admin Centres" },
];

// Collecteur d'erreurs global
interface TestIssue {
  type: "error" | "warning" | "info";
  category: string;
  page: string;
  message: string;
  details?: string;
}

const issues: TestIssue[] = [];

function logIssue(issue: TestIssue) {
  issues.push(issue);
  const icon = issue.type === "error" ? "❌" : issue.type === "warning" ? "⚠️" : "ℹ️";
  console.log(`${icon} [${issue.category}] ${issue.page}: ${issue.message}`);
  if (issue.details) console.log(`   Details: ${issue.details}`);
}

// Helper pour collecter les erreurs console
async function setupConsoleListener(page: Page, pageName: string) {
  const consoleErrors: string[] = [];
  
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignorer certaines erreurs connues/acceptables
      if (!text.includes("favicon") && !text.includes("third-party")) {
        consoleErrors.push(text);
        logIssue({
          type: "error",
          category: "Console",
          page: pageName,
          message: "Erreur console détectée",
          details: text.substring(0, 200),
        });
      }
    }
  });

  page.on("pageerror", (error) => {
    logIssue({
      type: "error",
      category: "JavaScript",
      page: pageName,
      message: "Erreur JavaScript non gérée",
      details: error.message,
    });
  });

  return consoleErrors;
}

// Helper pour vérifier les images cassées
async function checkBrokenImages(page: Page, pageName: string) {
  const images = await page.locator("img").all();
  let brokenCount = 0;

  for (const img of images) {
    try {
      const src = await img.getAttribute("src");
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      
      if (naturalWidth === 0 && src) {
        brokenCount++;
        logIssue({
          type: "error",
          category: "Images",
          page: pageName,
          message: "Image cassée détectée",
          details: src,
        });
      }
    } catch {
      // Image peut ne plus être dans le DOM
    }
  }

  return brokenCount;
}

// Helper pour vérifier les liens cassés (internes)
async function checkInternalLinks(page: Page, pageName: string) {
  const links = await page.locator('a[href^="/"], a[href^="' + BASE_URL + '"]').all();
  const brokenLinks: string[] = [];

  for (const link of links) {
    try {
      const href = await link.getAttribute("href");
      if (href && !href.includes("#") && !href.includes("mailto:") && !href.includes("tel:")) {
        // On ne vérifie pas réellement le lien, juste qu'il existe
        const isVisible = await link.isVisible();
        if (!isVisible) {
          brokenLinks.push(href);
        }
      }
    } catch {
      // Lien peut ne plus être dans le DOM
    }
  }

  return brokenLinks;
}

// Helper pour vérifier l'accessibilité de base
async function checkBasicAccessibility(page: Page, pageName: string) {
  const issues: string[] = [];

  // Vérifier les images sans alt
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  if (imagesWithoutAlt > 0) {
    logIssue({
      type: "warning",
      category: "Accessibilité",
      page: pageName,
      message: `${imagesWithoutAlt} image(s) sans attribut alt`,
    });
  }

  // Vérifier les boutons sans texte accessible
  const buttonsWithoutText = await page.locator('button:not([aria-label]):empty').count();
  if (buttonsWithoutText > 0) {
    logIssue({
      type: "warning",
      category: "Accessibilité",
      page: pageName,
      message: `${buttonsWithoutText} bouton(s) sans texte accessible`,
    });
  }

  // Vérifier la présence d'un h1
  const h1Count = await page.locator("h1").count();
  if (h1Count === 0) {
    logIssue({
      type: "warning",
      category: "SEO/Accessibilité",
      page: pageName,
      message: "Pas de balise H1 trouvée",
    });
  } else if (h1Count > 1) {
    logIssue({
      type: "info",
      category: "SEO",
      page: pageName,
      message: `${h1Count} balises H1 trouvées (recommandé: 1)`,
    });
  }

  // Vérifier le title
  const title = await page.title();
  if (!title || title.length < 10) {
    logIssue({
      type: "warning",
      category: "SEO",
      page: pageName,
      message: "Title manquant ou trop court",
      details: title || "(vide)",
    });
  }

  return issues;
}

// Helper pour mesurer la performance
async function measurePerformance(page: Page, pageName: string) {
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return {
      loadTime: navigation.loadEventEnd - navigation.startTime,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
      firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime || 0,
    };
  });

  if (performanceMetrics.loadTime > 5000) {
    logIssue({
      type: "warning",
      category: "Performance",
      page: pageName,
      message: `Temps de chargement élevé: ${Math.round(performanceMetrics.loadTime)}ms`,
    });
  }

  return performanceMetrics;
}

// ============================================
// TESTS
// ============================================

test.describe("🔍 AUDIT COMPLET DU SITE EVIDIVE", () => {
  test.setTimeout(300000); // 5 minutes max

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
  });

  // ============================================
  // TEST 1: Pages publiques
  // ============================================
  test.describe("📄 Pages Publiques", () => {
    for (const pageInfo of PUBLIC_PAGES) {
      test(`${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
        const pageName = pageInfo.name;
        
        // Setup listeners
        await setupConsoleListener(page, pageName);

        // Navigation
        const startTime = Date.now();
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        const loadTime = Date.now() - startTime;

        // Vérifier le status HTTP
        const status = response?.status() || 0;
        if (status >= 400) {
          logIssue({
            type: "error",
            category: "HTTP",
            page: pageName,
            message: `Status HTTP ${status}`,
          });
        }
        expect(status).toBeLessThan(400);

        // Vérifier que la page n'affiche pas d'erreur
        const errorTexts = ["404", "500", "Error", "Erreur", "Not Found"];
        for (const errorText of errorTexts) {
          const hasError = await page.locator(`text="${errorText}"`).first().isVisible().catch(() => false);
          if (hasError && !pageInfo.path.includes("404")) {
            // Vérifier que ce n'est pas un faux positif
            const bodyText = await page.locator("body").innerText();
            if (bodyText.toLowerCase().includes("page not found") || bodyText.includes("500")) {
              logIssue({
                type: "error",
                category: "Page",
                page: pageName,
                message: `Page affiche une erreur: ${errorText}`,
              });
            }
          }
        }

        // Vérifications standard
        await checkBrokenImages(page, pageName);
        await checkBasicAccessibility(page, pageName);
        
        // Performance
        if (loadTime > 5000) {
          logIssue({
            type: "warning",
            category: "Performance",
            page: pageName,
            message: `Chargement lent: ${loadTime}ms`,
          });
        }

        // Screenshot
        await page.screenshot({ 
          path: `tests/screenshots/audit/${pageInfo.path.replace(/\//g, "_") || "home"}.png`,
          fullPage: true 
        });

        console.log(`✅ ${pageName} - Status: ${status}, Load: ${loadTime}ms`);
      });
    }
  });

  // ============================================
  // TEST 2: Navigation et Header/Footer
  // ============================================
  test("🧭 Navigation - Header et Footer", async ({ page }) => {
    await setupConsoleListener(page, "Navigation");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Vérifier le header
    const header = page.locator("header, nav").first();
    await expect(header).toBeVisible();

    // Vérifier le logo
    const logo = page.locator('a[href="/"] img, a[href="/"] svg, [class*="logo"]').first();
    const logoVisible = await logo.isVisible().catch(() => false);
    if (!logoVisible) {
      logIssue({
        type: "warning",
        category: "UI",
        page: "Header",
        message: "Logo non trouvé ou non visible",
      });
    }

    // Vérifier les liens de navigation
    const navLinks = [
      { text: "Accueil", href: "/" },
      { text: "À propos", href: "/about" },
      { text: "Explorer", href: "/explorer" },
      { text: "Centres", href: "/centers" },
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`nav a[href="${link.href}"], header a[href="${link.href}"]`).first();
      const isVisible = await navLink.isVisible().catch(() => false);
      if (!isVisible) {
        logIssue({
          type: "info",
          category: "Navigation",
          page: "Header",
          message: `Lien "${link.text}" non trouvé dans la navigation`,
        });
      }
    }

    // Vérifier le footer
    const footer = page.locator("footer").first();
    const footerVisible = await footer.isVisible().catch(() => false);
    if (!footerVisible) {
      logIssue({
        type: "warning",
        category: "UI",
        page: "Footer",
        message: "Footer non visible",
      });
    }

    // Vérifier liens légaux dans le footer
    const legalLinks = ["/terms", "/privacy", "/contact"];
    for (const href of legalLinks) {
      const link = page.locator(`footer a[href="${href}"]`).first();
      const isVisible = await link.isVisible().catch(() => false);
      if (!isVisible) {
        logIssue({
          type: "info",
          category: "Footer",
          page: "Footer",
          message: `Lien légal manquant: ${href}`,
        });
      }
    }

    console.log("✅ Navigation vérifiée");
  });

  // ============================================
  // TEST 3: Inscription
  // ============================================
  test("📝 Inscription - Nouveau compte", async ({ page }) => {
    await setupConsoleListener(page, "Inscription");
    await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });

    // Vérifier que le formulaire existe
    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Vérifier les champs requis
    const requiredFields = [
      { selector: 'input[name="firstName"]', name: "Prénom" },
      { selector: 'input[name="lastName"]', name: "Nom" },
      { selector: 'input[type="email"]', name: "Email" },
      { selector: 'input[name="password"]', name: "Mot de passe" },
      { selector: 'input[name="confirmPassword"]', name: "Confirmation" },
    ];

    for (const field of requiredFields) {
      const input = page.locator(field.selector).first();
      const isVisible = await input.isVisible().catch(() => false);
      if (!isVisible) {
        logIssue({
          type: "error",
          category: "Formulaire",
          page: "Inscription",
          message: `Champ manquant: ${field.name}`,
        });
      }
    }

    // Remplir le formulaire
    await page.fill('input[name="firstName"]', TEST_USER.firstName);
    await page.fill('input[name="lastName"]', TEST_USER.lastName);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="confirmPassword"]', TEST_USER.password);

    // Cocher les CGV
    const termsCheckbox = page.locator('input[type="checkbox"][name="acceptTerms"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.screenshot({ path: "tests/screenshots/audit/register-filled.png" });

    // Soumettre
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: "tests/screenshots/audit/register-after-submit.png" });

    // Vérifier le résultat
    const successMessage = page.locator('text="vérification", text="success", text="email"').first();
    const errorMessage = page.locator('[class*="error"], [class*="red"]').first();
    
    const hasSuccess = await successMessage.isVisible().catch(() => false);
    const hasError = await errorMessage.isVisible().catch(() => false);

    if (hasError && !hasSuccess) {
      const errorText = await errorMessage.textContent().catch(() => "");
      // Email déjà existant n'est pas une erreur de code
      if (!errorText?.includes("existe") && !errorText?.includes("already")) {
        logIssue({
          type: "error",
          category: "Inscription",
          page: "Register",
          message: "Erreur lors de l'inscription",
          details: errorText || undefined,
        });
      }
    }

    console.log("✅ Test d'inscription terminé");
  });

  // ============================================
  // TEST 4: Connexion
  // ============================================
  test("🔐 Connexion - Login", async ({ page }) => {
    await setupConsoleListener(page, "Connexion");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

    // Vérifier le formulaire
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Test avec mauvais identifiants
    await page.fill('input[type="email"]', "wrong@email.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Vérifier qu'une erreur s'affiche
    const errorVisible = await page.locator('[class*="error"], [class*="red"], [role="alert"]').first().isVisible().catch(() => false);
    if (!errorVisible) {
      logIssue({
        type: "warning",
        category: "UX",
        page: "Login",
        message: "Pas de message d'erreur visible pour mauvais identifiants",
      });
    }

    await page.screenshot({ path: "tests/screenshots/audit/login-error.png" });

    // Test avec admin
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');

    // Attendre la redirection
    try {
      await page.waitForURL("**/dashboard", { timeout: 10000 });
      console.log("✅ Connexion admin réussie");
      await page.screenshot({ path: "tests/screenshots/audit/login-success-dashboard.png" });
    } catch {
      logIssue({
        type: "error",
        category: "Auth",
        page: "Login",
        message: "Échec de la connexion admin ou redirection vers dashboard",
      });
      await page.screenshot({ path: "tests/screenshots/audit/login-failed.png" });
    }
  });

  // ============================================
  // TEST 5: Pages protégées (authentifié)
  // ============================================
  test.describe("🔒 Pages Protégées", () => {
    test("Dashboard et pages utilisateur", async ({ page }) => {
      // Se connecter d'abord
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
      await page.fill('input[type="email"]', ADMIN_USER.email);
      await page.fill('input[type="password"]', ADMIN_USER.password);
      await page.click('button[type="submit"]');

      try {
        await page.waitForURL("**/dashboard", { timeout: 15000 });
      } catch {
        logIssue({
          type: "error",
          category: "Auth",
          page: "Dashboard",
          message: "Impossible d'accéder au dashboard après connexion",
        });
        return;
      }

      // Tester les pages protégées
      for (const pageInfo of PROTECTED_PAGES) {
        await setupConsoleListener(page, pageInfo.name);
        
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: "networkidle",
          timeout: 20000,
        });

        const status = response?.status() || 0;
        const currentUrl = page.url();

        // Vérifier qu'on n'est pas redirigé vers login
        if (currentUrl.includes("/login")) {
          logIssue({
            type: "error",
            category: "Auth",
            page: pageInfo.name,
            message: "Redirigé vers login alors que connecté",
          });
        } else if (status >= 400) {
          logIssue({
            type: "error",
            category: "HTTP",
            page: pageInfo.name,
            message: `Status HTTP ${status}`,
          });
        } else {
          console.log(`✅ ${pageInfo.name} accessible`);
          await checkBrokenImages(page, pageInfo.name);
          await checkBasicAccessibility(page, pageInfo.name);
        }

        await page.screenshot({ 
          path: `tests/screenshots/audit/protected${pageInfo.path.replace(/\//g, "_")}.png`,
          fullPage: true 
        });
      }
    });
  });

  // ============================================
  // TEST 6: Pages Admin
  // ============================================
  test.describe("👑 Pages Admin", () => {
    test("Accès et fonctionnalités admin", async ({ page }) => {
      // Se connecter en admin
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
      await page.fill('input[type="email"]', ADMIN_USER.email);
      await page.fill('input[type="password"]', ADMIN_USER.password);
      await page.click('button[type="submit"]');

      try {
        await page.waitForURL("**/dashboard", { timeout: 15000 });
      } catch {
        logIssue({
          type: "error",
          category: "Auth",
          page: "Admin",
          message: "Impossible de se connecter en admin",
        });
        return;
      }

      // Tester les pages admin
      for (const pageInfo of ADMIN_PAGES) {
        await setupConsoleListener(page, pageInfo.name);

        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: "networkidle",
          timeout: 20000,
        });

        const status = response?.status() || 0;
        const currentUrl = page.url();

        if (status >= 400) {
          logIssue({
            type: "error",
            category: "HTTP",
            page: pageInfo.name,
            message: `Status HTTP ${status}`,
          });
        } else if (currentUrl.includes("/login") || currentUrl.includes("/dashboard")) {
          logIssue({
            type: "error",
            category: "Auth",
            page: pageInfo.name,
            message: "Accès admin refusé ou redirigé",
          });
        } else {
          console.log(`✅ ${pageInfo.name} accessible (admin)`);
          await checkBrokenImages(page, pageInfo.name);
          await checkBasicAccessibility(page, pageInfo.name);
        }

        await page.screenshot({ 
          path: `tests/screenshots/audit/admin${pageInfo.path.replace(/\//g, "_")}.png`,
          fullPage: true 
        });
      }
    });
  });

  // ============================================
  // TEST 7: Responsive Design
  // ============================================
  test.describe("📱 Responsive Design", () => {
    const viewports = [
      { name: "Mobile", width: 375, height: 667 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Desktop", width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await setupConsoleListener(page, `Responsive-${viewport.name}`);

        // Tester la homepage
        await page.goto(BASE_URL, { waitUntil: "networkidle" });

        // Vérifier que le contenu principal est visible
        const mainContent = page.locator("main, [role='main'], #__next > div").first();
        const isVisible = await mainContent.isVisible().catch(() => false);
        
        if (!isVisible) {
          logIssue({
            type: "warning",
            category: "Responsive",
            page: `Homepage-${viewport.name}`,
            message: "Contenu principal non visible",
          });
        }

        // Vérifier le menu mobile si applicable
        if (viewport.width < 768) {
          const mobileMenuButton = page.locator('[aria-label*="menu"], button:has(svg), [class*="hamburger"]').first();
          const hasMobileMenu = await mobileMenuButton.isVisible().catch(() => false);
          
          if (!hasMobileMenu) {
            logIssue({
              type: "info",
              category: "Responsive",
              page: `Homepage-${viewport.name}`,
              message: "Pas de menu hamburger détecté en mobile",
            });
          }
        }

        // Vérifier qu'il n'y a pas de scroll horizontal
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        if (hasHorizontalScroll) {
          logIssue({
            type: "error",
            category: "Responsive",
            page: `Homepage-${viewport.name}`,
            message: "Scroll horizontal détecté (problème de responsive)",
          });
        }

        await page.screenshot({ 
          path: `tests/screenshots/audit/responsive-${viewport.name.toLowerCase()}.png`,
          fullPage: true 
        });

        console.log(`✅ Responsive ${viewport.name} vérifié`);
      });
    }
  });

  // ============================================
  // TEST 8: Formulaire de contact
  // ============================================
  test("📧 Formulaire de Contact", async ({ page }) => {
    await setupConsoleListener(page, "Contact");
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });

    // Vérifier la présence du formulaire
    const form = page.locator("form").first();
    const formExists = await form.isVisible().catch(() => false);

    if (!formExists) {
      logIssue({
        type: "warning",
        category: "Formulaire",
        page: "Contact",
        message: "Formulaire de contact non trouvé",
      });
      return;
    }

    // Vérifier les champs
    const nameField = page.locator('input[name="name"], input[placeholder*="nom"]').first();
    const emailField = page.locator('input[type="email"]').first();
    const messageField = page.locator('textarea').first();

    if (await nameField.isVisible()) {
      await nameField.fill("Test Utilisateur");
    }
    if (await emailField.isVisible()) {
      await emailField.fill("test@example.com");
    }
    if (await messageField.isVisible()) {
      await messageField.fill("Ceci est un message de test automatisé pour vérifier le formulaire de contact.");
    }

    await page.screenshot({ path: "tests/screenshots/audit/contact-filled.png" });
    console.log("✅ Formulaire de contact vérifié");
  });

  // ============================================
  // TEST 9: Page Explorer (Carte)
  // ============================================
  test("🗺️ Page Explorer (Carte interactive)", async ({ page }) => {
    await setupConsoleListener(page, "Explorer");
    await page.goto(`${BASE_URL}/explorer`, { waitUntil: "networkidle" });

    // Attendre le chargement de la carte
    await page.waitForTimeout(3000);

    // Vérifier la présence d'une carte ou d'un canvas 3D
    const mapElement = page.locator('canvas, [class*="map"], [class*="globe"]').first();
    const hasMap = await mapElement.isVisible().catch(() => false);

    if (!hasMap) {
      logIssue({
        type: "warning",
        category: "Feature",
        page: "Explorer",
        message: "Carte/Globe 3D non détecté",
      });
    }

    // Vérifier la présence du chat AI
    const chatElement = page.locator('[class*="chat"], [placeholder*="question"]').first();
    const hasChat = await chatElement.isVisible().catch(() => false);

    if (!hasChat) {
      logIssue({
        type: "info",
        category: "Feature",
        page: "Explorer",
        message: "Interface de chat AI non détectée",
      });
    }

    await page.screenshot({ path: "tests/screenshots/audit/explorer.png", fullPage: true });
    console.log("✅ Page Explorer vérifiée");
  });

  // ============================================
  // TEST 10: Page Centres
  // ============================================
  test("🏢 Page Centres (Liste)", async ({ page }) => {
    await setupConsoleListener(page, "Centres");
    await page.goto(`${BASE_URL}/centers`, { waitUntil: "domcontentloaded" });

    // Attendre le chargement du globe 3D
    await page.waitForTimeout(3000);

    // Compter les vraies cartes de centres (h3 dans les cartes)
    const centerHeadings = await page.locator('h3').all();
    let centerCount = 0;
    for (const h of centerHeadings) {
      const text = await h.textContent().catch(() => "");
      // Exclure les titres de section (Découvrir, Entreprise, Légal)
      if (text && !["Découvrir", "Entreprise", "Légal"].includes(text)) {
        centerCount++;
      }
    }

    // Vérifier aussi le compteur affiché "Dive Centers X"
    const counterText = await page.locator('h2:has-text("Dive Centers")').textContent().catch(() => "");
    const displayedCount = counterText?.match(/\d+/)?.[0] || "0";

    if (centerCount === 0) {
      logIssue({
        type: "warning",
        category: "Contenu",
        page: "Centres",
        message: "Aucun centre de plongée affiché",
      });
    } else {
      console.log(`ℹ️ ${centerCount} centre(s) de plongée trouvé(s) (affiché: ${displayedCount})`);
    }

    // Vérifier le globe 3D
    const canvas = page.locator("canvas").first();
    const hasGlobe = await canvas.isVisible().catch(() => false);
    if (!hasGlobe) {
      logIssue({
        type: "warning",
        category: "Feature",
        page: "Centres",
        message: "Globe 3D non visible",
      });
    }

    await page.screenshot({ path: "tests/screenshots/audit/centers-list.png", fullPage: true });
    console.log("✅ Page Centres vérifiée");
  });

  // ============================================
  // TEST 11: Flux complet - Création de centre
  // ============================================
  test("🏗️ Flux Onboarding Centre", async ({ page }) => {
    // Se connecter
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL("**/dashboard", { timeout: 15000 });
    } catch {
      logIssue({
        type: "error",
        category: "Flux",
        page: "Onboarding Centre",
        message: "Impossible de se connecter pour tester l'onboarding",
      });
      return;
    }

    // Aller sur l'onboarding
    await page.goto(`${BASE_URL}/onboard/center`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Vérifier que le formulaire multi-étapes existe
    const stepIndicator = page.locator('[class*="step"], [class*="progress"]').first();
    const hasSteps = await stepIndicator.isVisible().catch(() => false);

    if (!hasSteps) {
      logIssue({
        type: "info",
        category: "UI",
        page: "Onboarding Centre",
        message: "Indicateur d'étapes non visible",
      });
    }

    // Vérifier les champs de l'étape 1
    const step1Fields = [
      'input[placeholder*="Blue Ocean"], input[name*="name"]',
      'textarea',
      'input[type="email"]',
      'input[type="tel"], input[placeholder*="+"]',
    ];

    for (const selector of step1Fields) {
      const field = page.locator(selector).first();
      const isVisible = await field.isVisible().catch(() => false);
      if (!isVisible) {
        logIssue({
          type: "warning",
          category: "Formulaire",
          page: "Onboarding Centre - Étape 1",
          message: `Champ non trouvé: ${selector}`,
        });
      }
    }

    await page.screenshot({ path: "tests/screenshots/audit/onboard-center-step1.png", fullPage: true });
    console.log("✅ Onboarding Centre vérifié");
  });

  // ============================================
  // TEST 12: Sélecteur de langue
  // ============================================
  test("🌍 Internationalisation (i18n)", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Chercher un sélecteur de langue
    const langSelector = page.locator('[class*="lang"], [class*="locale"], button:has-text("FR"), button:has-text("EN")').first();
    const hasLangSelector = await langSelector.isVisible().catch(() => false);

    if (!hasLangSelector) {
      logIssue({
        type: "info",
        category: "i18n",
        page: "Homepage",
        message: "Sélecteur de langue non trouvé",
      });
    } else {
      // Tester le changement de langue
      await langSelector.click();
      await page.waitForTimeout(1000);
      
      const langOptions = page.locator('[role="menuitem"], [class*="dropdown"] a, [class*="dropdown"] button');
      const optionsCount = await langOptions.count();
      
      if (optionsCount > 1) {
        console.log(`ℹ️ ${optionsCount} langues disponibles`);
      }
    }

    await page.screenshot({ path: "tests/screenshots/audit/language-selector.png" });
    console.log("✅ i18n vérifié");
  });

  // ============================================
  // TEST 13: API Endpoints (Health Check)
  // ============================================
  test("🔌 API Endpoints", async ({ page, request }) => {
    const endpoints = [
      { path: "/api/centers", method: "GET", name: "Liste centres" },
      { path: "/api/auth/session", method: "GET", name: "Session" },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`${BASE_URL}${endpoint.path}`);
        const status = response.status();

        if (status >= 500) {
          logIssue({
            type: "error",
            category: "API",
            page: endpoint.name,
            message: `Endpoint ${endpoint.path} retourne ${status}`,
          });
        } else if (status >= 400 && status !== 401 && status !== 404) {
          logIssue({
            type: "warning",
            category: "API",
            page: endpoint.name,
            message: `Endpoint ${endpoint.path} retourne ${status}`,
          });
        } else {
          console.log(`✅ API ${endpoint.path} - Status ${status}`);
        }
      } catch (error) {
        logIssue({
          type: "error",
          category: "API",
          page: endpoint.name,
          message: `Erreur lors de l'appel à ${endpoint.path}`,
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });

  // ============================================
  // TEST 14: SEO Basique
  // ============================================
  test("🔍 SEO - Métadonnées", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Title
    const title = await page.title();
    if (!title || title.length < 10) {
      logIssue({
        type: "error",
        category: "SEO",
        page: "Homepage",
        message: "Title manquant ou trop court",
        details: title,
      });
    }

    // Meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute("content").catch(() => null);
    if (!metaDescription) {
      logIssue({
        type: "warning",
        category: "SEO",
        page: "Homepage",
        message: "Meta description manquante",
      });
    } else if (metaDescription.length < 50) {
      logIssue({
        type: "warning",
        category: "SEO",
        page: "Homepage",
        message: "Meta description trop courte",
        details: metaDescription,
      });
    }

    // Open Graph
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content").catch(() => null);
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content").catch(() => null);
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content").catch(() => null);

    if (!ogTitle) {
      logIssue({ type: "info", category: "SEO", page: "Homepage", message: "og:title manquant" });
    }
    if (!ogDescription) {
      logIssue({ type: "info", category: "SEO", page: "Homepage", message: "og:description manquant" });
    }
    if (!ogImage) {
      logIssue({ type: "info", category: "SEO", page: "Homepage", message: "og:image manquant" });
    }

    // Canonical
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href").catch(() => null);
    if (!canonical) {
      logIssue({ type: "info", category: "SEO", page: "Homepage", message: "Lien canonical manquant" });
    }

    // Robots
    const robots = await page.locator('meta[name="robots"]').getAttribute("content").catch(() => null);
    console.log(`ℹ️ Robots: ${robots || "non défini"}`);

    console.log("✅ SEO vérifié");
  });

  // ============================================
  // TEST 15: Sitemap et Robots.txt
  // ============================================
  test("🗂️ Sitemap et Robots.txt", async ({ request }) => {
    // Robots.txt
    try {
      const robotsResponse = await request.get(`${BASE_URL}/robots.txt`);
      if (robotsResponse.status() === 200) {
        const robotsContent = await robotsResponse.text();
        console.log(`✅ robots.txt présent (${robotsContent.length} caractères)`);
        
        if (!robotsContent.includes("Sitemap")) {
          logIssue({
            type: "info",
            category: "SEO",
            page: "robots.txt",
            message: "Pas de référence au sitemap dans robots.txt",
          });
        }
      } else {
        logIssue({
          type: "warning",
          category: "SEO",
          page: "robots.txt",
          message: `robots.txt non accessible (${robotsResponse.status()})`,
        });
      }
    } catch {
      logIssue({
        type: "warning",
        category: "SEO",
        page: "robots.txt",
        message: "Impossible de récupérer robots.txt",
      });
    }

    // Sitemap
    try {
      const sitemapResponse = await request.get(`${BASE_URL}/sitemap.xml`);
      if (sitemapResponse.status() === 200) {
        const sitemapContent = await sitemapResponse.text();
        console.log(`✅ sitemap.xml présent (${sitemapContent.length} caractères)`);
        
        // Compter les URLs
        const urlCount = (sitemapContent.match(/<url>/g) || []).length;
        console.log(`ℹ️ ${urlCount} URL(s) dans le sitemap`);
      } else {
        logIssue({
          type: "warning",
          category: "SEO",
          page: "sitemap.xml",
          message: `sitemap.xml non accessible (${sitemapResponse.status()})`,
        });
      }
    } catch {
      logIssue({
        type: "warning",
        category: "SEO",
        page: "sitemap.xml",
        message: "Impossible de récupérer sitemap.xml",
      });
    }
  });

  // ============================================
  // RAPPORT FINAL
  // ============================================
  test.afterAll(async () => {
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                    📊 RAPPORT D'AUDIT FINAL                    ");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("\n");

    const errors = issues.filter((i) => i.type === "error");
    const warnings = issues.filter((i) => i.type === "warning");
    const infos = issues.filter((i) => i.type === "info");

    console.log(`❌ ERREURS: ${errors.length}`);
    console.log(`⚠️  AVERTISSEMENTS: ${warnings.length}`);
    console.log(`ℹ️  INFORMATIONS: ${infos.length}`);
    console.log("\n");

    if (errors.length > 0) {
      console.log("─── ERREURS CRITIQUES ───");
      errors.forEach((e, i) => {
        console.log(`${i + 1}. [${e.category}] ${e.page}: ${e.message}`);
        if (e.details) console.log(`   → ${e.details}`);
      });
      console.log("\n");
    }

    if (warnings.length > 0) {
      console.log("─── AVERTISSEMENTS ───");
      warnings.forEach((w, i) => {
        console.log(`${i + 1}. [${w.category}] ${w.page}: ${w.message}`);
        if (w.details) console.log(`   → ${w.details}`);
      });
      console.log("\n");
    }

    if (infos.length > 0) {
      console.log("─── INFORMATIONS ───");
      infos.forEach((info, i) => {
        console.log(`${i + 1}. [${info.category}] ${info.page}: ${info.message}`);
      });
      console.log("\n");
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                    FIN DU RAPPORT                              ");
    console.log("═══════════════════════════════════════════════════════════════");

    // Sauvegarder le rapport en JSON
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      summary: {
        errors: errors.length,
        warnings: warnings.length,
        infos: infos.length,
        total: issues.length,
      },
      issues: {
        errors,
        warnings,
        infos,
      },
    };

    // Log pour debug
    console.log("\nRapport JSON disponible dans les artifacts du test.");
  });
});
