import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const APP_DIR = path.join(process.cwd(), "src", "app", "[locale]");
const DEFAULT_BASE_URL = "http://localhost:3000";
const SAMPLES_ENV_KEY = "CHECK_SITE_ROUTE_SAMPLES" as const;

const ROUTE_GROUP_PREFIX = "(" as const;
const DYNAMIC_SEGMENT_START = "[" as const;
const DYNAMIC_SEGMENT_END = "]" as const;
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_CONCURRENCY = 8;

type RouteEntry = {
  readonly pattern: string;
  readonly segments: readonly string[];
};

type RouteCheck = {
  readonly locale: string;
  readonly pattern: string;
  readonly path: string;
  readonly url: string;
  readonly skipped: boolean;
  readonly skipReason?: string;
  readonly status?: number;
  readonly ok?: boolean;
  readonly error?: string;
};

function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}

function parseSamplesEnv(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStringRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function isDynamicSegment(segment: string): boolean {
  return (
    segment.startsWith(DYNAMIC_SEGMENT_START) &&
    segment.endsWith(DYNAMIC_SEGMENT_END)
  );
}

function normalizeSegments(segments: readonly string[]): string[] {
  return segments.filter((segment) => !segment.startsWith(ROUTE_GROUP_PREFIX));
}

function buildPattern(segments: readonly string[]): string {
  if (segments.length === 0) return "/";
  return `/${segments.join("/")}`;
}

async function walkForPages(dir: string, parentSegments: readonly string[]): Promise<RouteEntry[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const routes: RouteEntry[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nextSegments = [...parentSegments, entry.name];
      const nested = await walkForPages(entryPath, nextSegments);
      routes.push(...nested);
    } else if (entry.isFile() && entry.name === "page.tsx") {
      routes.push({
        pattern: buildPattern(normalizeSegments(parentSegments)),
        segments: normalizeSegments(parentSegments),
      });
    }
  }

  return routes;
}

function buildRoutePath(
  segments: readonly string[],
  samples: Record<string, string>,
): { path: string; skipped: boolean; reason?: string } {
  if (segments.length === 0) return { path: "/", skipped: false };

  const hasDynamic = segments.some(isDynamicSegment);
  const pattern = buildPattern(segments);

  if (!hasDynamic) {
    return { path: pattern, skipped: false };
  }

  const sample = samples[pattern.replace(/^\//, "")];
  if (!sample) {
    return {
      path: pattern,
      skipped: true,
      reason: `Route dynamique sans échantillon (${SAMPLES_ENV_KEY})`,
    };
  }

  return { path: `/${sample.replace(/^\//, "")}`, skipped: false };
}

async function checkRoute(
  url: string,
  timeoutMs: number
): Promise<{ status?: number; ok: boolean; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
    });
    return { status: response.status, ok: response.ok };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool<TInput, TOutput>(
  items: readonly TInput[],
  concurrency: number,
  worker: (item: TInput) => Promise<TOutput>
): Promise<TOutput[]> {
  const results: TOutput[] = [];
  let index = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      const item = items[currentIndex];
      if (item === undefined) return;
      const result = await worker(item);
      results.push(result);
    }
  });

  await Promise.all(workers);
  return results;
}

async function main(): Promise<void> {
  const baseUrl =
    process.env.CHECK_SITE_BASE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    DEFAULT_BASE_URL;

  const rawSamples = process.env[SAMPLES_ENV_KEY];
  const samples = parseSamplesEnv(rawSamples);

  const configPath = path.join(process.cwd(), "src", "i18n", "config");
  const configUrl = pathToFileURL(configPath).href;
  const localesModule = await import(configUrl);
  const locales: readonly string[] = localesModule.locales as readonly string[];

  const timeoutMs = parseInt(process.env.CHECK_SITE_TIMEOUT_MS ?? "", 10);
  const resolvedTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;

  const routes = await walkForPages(APP_DIR, []);
  const concurrencyEnv = parseInt(process.env.CHECK_SITE_CONCURRENCY ?? "", 10);
  const concurrency =
    Number.isFinite(concurrencyEnv) && concurrencyEnv > 0
      ? concurrencyEnv
      : DEFAULT_CONCURRENCY;

  const checks: RouteCheck[] = [];
  const tasks: Array<{
    locale: string;
    pattern: string;
    path: string;
    url: string;
  }> = [];

  for (const locale of locales) {
    for (const route of routes) {
      const { path: routePath, skipped, reason } = buildRoutePath(route.segments, samples);
      const fullPath = routePath === "/" ? `/${locale}` : `/${locale}${routePath}`;
      const url = new URL(fullPath, baseUrl).toString();

      if (skipped) {
        checks.push({
          locale,
          pattern: route.pattern,
          path: fullPath,
          url,
          skipped: true,
          skipReason: reason,
        });
        continue;
      }

      tasks.push({
        locale,
        pattern: route.pattern,
        path: fullPath,
        url,
      });
    }
  }

  const results = await runPool(tasks, concurrency, async (task) => {
    const result = await checkRoute(task.url, resolvedTimeoutMs);
    return {
      locale: task.locale,
      pattern: task.pattern,
      path: task.path,
      url: task.url,
      skipped: false,
      status: result.status,
      ok: result.ok,
      error: result.error,
    } satisfies RouteCheck;
  });

  checks.push(...results);

  const failed = checks.filter((check) => !check.skipped && !check.ok);
  const skipped = checks.filter((check) => check.skipped);

  console.log("=== Contrôle des pages (App Router) ===");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Locales: ${locales.join(", ")}`);
  console.log(`Pages détectées: ${routes.length}`);
  console.log(`Checks effectués: ${checks.length - skipped.length}`);
  console.log(`Échecs: ${failed.length}`);
  console.log(`Ignorés: ${skipped.length}`);

  if (failed.length > 0) {
    console.log("\n--- Échecs ---");
    for (const check of failed) {
      const status = check.status ?? "no-status";
      const error = check.error ? ` | ${check.error}` : "";
      console.log(`[${check.locale}] ${check.url} -> ${status}${error}`);
    }
  }

  if (skipped.length > 0) {
    console.log("\n--- Ignorés (dynamiques) ---");
    for (const check of skipped) {
      const reason = check.skipReason ?? "Raison inconnue";
      console.log(`[${check.locale}] ${check.path} -> ${reason}`);
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Erreur inconnue";
  console.error(`Erreur script: ${message}`);
  process.exitCode = 1;
});
