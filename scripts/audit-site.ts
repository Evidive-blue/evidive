import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Page, type Browser } from "@playwright/test";

type AuditIssue = {
  readonly type: string;
  readonly message: string;
  readonly count?: number;
  readonly selectorSample?: string;
};

type PageAudit = {
  readonly url: string;
  readonly status?: number;
  readonly ok: boolean;
  readonly redirectedTo?: string;
  readonly errors: readonly string[];
  readonly consoleErrors: readonly string[];
  readonly requestFailures: readonly string[];
  readonly issues: readonly AuditIssue[];
  readonly links: readonly string[];
};

type CrawlConfig = {
  readonly baseUrl: string;
  readonly maxPages: number;
  readonly maxDepth: number;
  readonly navTimeoutMs: number;
  readonly includePatterns: readonly RegExp[];
  readonly excludePatterns: readonly RegExp[];
  readonly outputDir: string;
  readonly locales: readonly string[];
  readonly startPaths: readonly string[];
};

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_MAX_PAGES = 200;
const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_NAV_TIMEOUT_MS = 20000;
const DEFAULT_OUTPUT_DIR = "reports";

const SKIP_PROTOCOLS = new Set(["mailto:", "tel:", "javascript:"]);

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePatterns(value: string | undefined): RegExp[] {
  if (!value) return [];
  return value
    .split(",")
    .map((raw) => raw.trim())
    .filter((raw) => raw.length > 0)
    .map((raw) => new RegExp(raw));
}

function normalizePath(value: string): string {
  if (!value.startsWith("/")) return `/${value}`;
  return value;
}

function shouldInclude(url: string, config: CrawlConfig): boolean {
  if (config.excludePatterns.some((pattern) => pattern.test(url))) return false;
  if (config.includePatterns.length === 0) return true;
  return config.includePatterns.some((pattern) => pattern.test(url));
}

function getOrigin(url: string): string {
  return new URL(url).origin;
}

async function loadLocales(): Promise<readonly string[]> {
  const configPath = path.join(process.cwd(), "src", "i18n", "config");
  const configUrl = pathToFileURL(configPath).href;
  const localesModule = await import(configUrl);
  const locales = localesModule.locales as readonly string[];
  return locales;
}

async function collectLinks(page: Page, baseUrl: string): Promise<string[]> {
  const rawLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .map((anchor) => anchor.getAttribute("href"))
      .filter((href): href is string => typeof href === "string");
  });

  const origin = getOrigin(baseUrl);
  const resolved: string[] = [];

  for (const href of rawLinks) {
    const trimmed = href.trim();
    if (trimmed.length === 0) continue;
    if (SKIP_PROTOCOLS.has(trimmed.split(/[\s#]/)[0]?.toLowerCase() ?? "")) continue;

    try {
      const url = new URL(trimmed, baseUrl);
      if (url.origin !== origin) continue;
      url.hash = "";
      url.search = "";
      resolved.push(url.toString());
    } catch {
      continue;
    }
  }

  return Array.from(new Set(resolved));
}

async function auditPageDom(page: Page): Promise<AuditIssue[]> {
  return page.evaluate(() => {
    function computeAccessibleName(element: Element): string {
      const ariaLabel = element.getAttribute("aria-label") ?? "";
      if (ariaLabel.trim().length > 0) return ariaLabel.trim();

      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        const ids = labelledBy.split(/\s+/).filter((id) => id.length > 0);
        const texts = ids
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ")
          .trim();
        if (texts.length > 0) return texts;
      }

      const text = element.textContent ?? "";
      return text.trim();
    }

    const issues: AuditIssue[] = [];
    const title = document.title?.trim() ?? "";
    if (title.length === 0) {
      issues.push({ type: "missing-title", message: "Missing document title" });
    }

    const description = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!description?.content?.trim()) {
      issues.push({ type: "missing-description", message: "Missing meta description" });
    }

    const h1Count = document.querySelectorAll("h1").length;
    if (h1Count === 0) {
      issues.push({ type: "missing-h1", message: "No h1 on page" });
    }
    if (h1Count > 1) {
      issues.push({ type: "multiple-h1", message: "Multiple h1 on page", count: h1Count });
    }

    const htmlLang = document.documentElement.getAttribute("lang") ?? "";
    if (htmlLang.trim().length === 0) {
      issues.push({ type: "missing-lang", message: "Missing html lang attribute" });
    }

    const images = Array.from(document.querySelectorAll("img"));
    const missingAlt = images.filter((img) => !img.hasAttribute("alt") || (img.getAttribute("alt") ?? "").trim().length === 0);
    if (missingAlt.length > 0) {
      issues.push({
        type: "missing-alt",
        message: "Images missing alt text",
        count: missingAlt.length,
        selectorSample: missingAlt[0]?.outerHTML?.slice(0, 160),
      });
    }

    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const unlabeledLinks = anchors.filter((anchor) => {
      const name = computeAccessibleName(anchor);
      return name.length === 0;
    });
    if (unlabeledLinks.length > 0) {
      issues.push({
        type: "link-no-name",
        message: "Links without accessible name",
        count: unlabeledLinks.length,
        selectorSample: unlabeledLinks[0]?.outerHTML?.slice(0, 160),
      });
    }

    const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
    const unlabeledButtons = buttons.filter((button) => {
      const name = computeAccessibleName(button);
      return name.length === 0;
    });
    if (unlabeledButtons.length > 0) {
      issues.push({
        type: "button-no-name",
        message: "Buttons without accessible name",
        count: unlabeledButtons.length,
        selectorSample: unlabeledButtons[0]?.outerHTML?.slice(0, 160),
      });
    }

    const formFields = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));
    const unlabeledFields = formFields.filter((field) => {
      if ((field as HTMLInputElement).type === "hidden") return false;
      const ariaLabel = field.getAttribute("aria-label") ?? "";
      const ariaLabelledBy = field.getAttribute("aria-labelledby") ?? "";
      if (ariaLabel.trim().length > 0 || ariaLabelledBy.trim().length > 0) return false;
      const id = field.getAttribute("id");
      if (id && document.querySelector(`label[for='${id}']`)) return false;
      if (field.closest("label")) return false;
      return true;
    });
    if (unlabeledFields.length > 0) {
      issues.push({
        type: "field-no-label",
        message: "Form fields without label",
        count: unlabeledFields.length,
        selectorSample: unlabeledFields[0]?.outerHTML?.slice(0, 160),
      });
    }

    const ids = Array.from(document.querySelectorAll<HTMLElement>("[id]"))
      .map((el) => el.getAttribute("id"))
      .filter((id): id is string => typeof id === "string");
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      issues.push({
        type: "duplicate-ids",
        message: "Duplicate ids detected",
        count: new Set(duplicates).size,
      });
    }

    return issues;
  });
}

async function auditSinglePage(
  page: Page,
  url: string,
  navTimeoutMs: number
): Promise<PageAudit> {
  const errors: string[] = [];
  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];

  const onPageError = (error: Error) => {
    errors.push(error.message);
  };
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  };
  const onRequestFailed = (request: { url: () => string; failure: () => { errorText?: string } | null }) => {
    const failure = request.failure();
    const message = failure?.errorText ? ` (${failure.errorText})` : "";
    requestFailures.push(`${request.url()}${message}`);
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  page.on("requestfailed", onRequestFailed);

  let response: Awaited<ReturnType<Page["goto"]>> | null = null;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Audit timeout")), navTimeoutMs + 5000);
    });
    response = await Promise.race([
      page.goto(url, { waitUntil: "domcontentloaded" }),
      timeoutPromise,
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Navigation error";
    errors.push(message);
  }

  const status = response?.status();
  const ok = response?.ok() ?? false;
  const redirectedTo = response?.url() !== url ? response?.url() : undefined;

  const issues = response ? await auditPageDom(page) : [];
  const links = response ? await collectLinks(page, url) : [];

  page.off("pageerror", onPageError);
  page.off("console", onConsole);
  page.off("requestfailed", onRequestFailed);

  return {
    url,
    status,
    ok,
    redirectedTo,
    errors,
    consoleErrors,
    requestFailures,
    issues,
    links,
  };
}

async function crawl(config: CrawlConfig): Promise<readonly PageAudit[]> {
  const browser: Browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript({
    content: "globalThis.__name = (value, _name) => value;",
  });
  page.setDefaultNavigationTimeout(config.navTimeoutMs);
  page.setDefaultTimeout(config.navTimeoutMs);

  const queue: Array<{ url: string; depth: number }> = [];
  const visited = new Set<string>();
  const audits: PageAudit[] = [];

  for (const locale of config.locales) {
    for (const startPath of config.startPaths) {
      const pathWithLocale = startPath === "/" ? `/${locale}` : `/${locale}${startPath}`;
      const url = new URL(pathWithLocale, config.baseUrl).toString();
      if (!visited.has(url)) {
        queue.push({ url, depth: 0 });
      }
    }
  }

  while (queue.length > 0 && audits.length < config.maxPages) {
    const next = queue.shift();
    if (!next) break;
    if (visited.has(next.url)) continue;
    visited.add(next.url);

    if (!shouldInclude(next.url, config)) continue;

    const audit = await auditSinglePage(page, next.url, config.navTimeoutMs);
    audits.push(audit);

    if (next.depth >= config.maxDepth) continue;
    for (const link of audit.links) {
      if (!visited.has(link)) {
        queue.push({ url: link, depth: next.depth + 1 });
      }
    }
  }

  await browser.close();
  return audits;
}

function buildConfig(): CrawlConfig {
  const baseUrl =
    process.env.CHECK_SITE_BASE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    DEFAULT_BASE_URL;

  const includePatterns = parsePatterns(process.env.CHECK_SITE_INCLUDE);
  const excludePatterns = parsePatterns(process.env.CHECK_SITE_EXCLUDE);
  const maxPages = parseNumber(process.env.CHECK_SITE_MAX_PAGES, DEFAULT_MAX_PAGES);
  const maxDepth = parseNumber(process.env.CHECK_SITE_MAX_DEPTH, DEFAULT_MAX_DEPTH);
  const navTimeoutMs = parseNumber(
    process.env.CHECK_SITE_NAV_TIMEOUT_MS,
    DEFAULT_NAV_TIMEOUT_MS
  );
  const outputDir = process.env.CHECK_SITE_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR;

  const startPathsEnv = process.env.CHECK_SITE_START_PATHS;
  const startPaths = startPathsEnv
    ? startPathsEnv.split(",").map((value) => normalizePath(value.trim()))
    : ["/"];

  return {
    baseUrl,
    maxPages,
    maxDepth,
    navTimeoutMs,
    includePatterns,
    excludePatterns,
    outputDir,
    locales: [],
    startPaths,
  };
}

async function main(): Promise<void> {
  const config = buildConfig();
  const locales = await loadLocales();
  const fullConfig: CrawlConfig = { ...config, locales };

  const results = await crawl(fullConfig);
  const failures = results.filter((audit) => !audit.ok);
  const withIssues = results.filter((audit) => audit.issues.length > 0);
  const withErrors = results.filter(
    (audit) =>
      audit.errors.length > 0 || audit.consoleErrors.length > 0 || audit.requestFailures.length > 0
  );

  await mkdir(fullConfig.outputDir, { recursive: true });
  const outputPath = path.join(fullConfig.outputDir, "site-audit.json");
  await writeFile(outputPath, JSON.stringify(results, null, 2), "utf-8");

  console.log("=== Site audit (Playwright) ===");
  console.log(`Base URL: ${fullConfig.baseUrl}`);
  console.log(`Locales: ${fullConfig.locales.join(", ")}`);
  console.log(`Pages auditees: ${results.length}`);
  console.log(`Status non-OK: ${failures.length}`);
  console.log(`Pages avec issues DOM: ${withIssues.length}`);
  console.log(`Pages avec erreurs runtime: ${withErrors.length}`);
  console.log(`Rapport: ${outputPath}`);

  if (failures.length > 0) {
    console.log("\n--- Status non-OK ---");
    for (const item of failures) {
      console.log(`${item.status ?? "no-status"} ${item.url}`);
    }
  }

  if (withErrors.length > 0) {
    console.log("\n--- Erreurs runtime ---");
    for (const item of withErrors) {
      const parts = [
        item.errors.length > 0 ? `pageerror=${item.errors.length}` : null,
        item.consoleErrors.length > 0 ? `console=${item.consoleErrors.length}` : null,
        item.requestFailures.length > 0 ? `requestfail=${item.requestFailures.length}` : null,
      ].filter((value): value is string => Boolean(value));
      console.log(`${item.url} -> ${parts.join(", ")}`);
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Audit error: ${message}`);
  process.exitCode = 1;
});
