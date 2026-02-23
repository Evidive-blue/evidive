import { hasLocale, IntlErrorCode } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "../src/i18n/routing";

type Messages = Record<string, unknown>;

/** Deep-merge `patch` over `base`, returning a new object. */
function deepMerge(base: Messages, patch: Messages): Messages {
  const result: Messages = { ...base };
  for (const key of Object.keys(patch)) {
    const bVal = base[key];
    const pVal = patch[key];
    if (
      typeof bVal === "object" &&
      bVal !== null &&
      !Array.isArray(bVal) &&
      typeof pVal === "object" &&
      pVal !== null &&
      !Array.isArray(pVal)
    ) {
      result[key] = deepMerge(bVal as Messages, pVal as Messages);
    } else {
      result[key] = pVal;
    }
  }
  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // Validate the locale using next-intl v4's hasLocale helper
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Always load English as the base fallback
  const enMessages: Messages = (await import("../messages/en.json")).default;

  // Load locale-specific messages and deep-merge over English
  const localeMessages: Messages =
    locale === "en"
      ? enMessages
      : deepMerge(
          enMessages,
          (await import(`../messages/${locale}.json`)).default as Messages,
        );

  return {
    locale,
    messages: localeMessages,
    onError(error) {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        // Missing translations after merge should not happen — log as warning
        // This indicates a key is missing even from en.json
        tracing("warn", `Missing translation: ${error.message}`);
      }
    },
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter(Boolean).join(".");
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        return path;
      }
      return path;
    },
  };
});

/** Simple logger that works in both server and edge runtimes. */
function tracing(level: "warn" | "error", message: string): void {
  if (level === "error") {
    console.error(`[i18n] ${message}`);
  } else {
    console.warn(`[i18n] ${message}`);
  }
}
