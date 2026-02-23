"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  isAuthenticated,
  clearToken,
  authApi,
  isAdmin,
  setCachedAuthState,
} from "@/lib/api";
import { AuthModal } from "@/components/auth-modal";

type AuthView = "login" | "register";

/* ── Icon components ── */

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  cs: "Čeština",
  sv: "Svenska",
  da: "Dansk",
  fi: "Suomi",
  hu: "Magyar",
  ro: "Română",
  el: "Ελληνικά",
  sk: "Slovenčina",
  bg: "Български",
  hr: "Hrvatski",
  lt: "Lietuvių",
  lv: "Latviešu",
  et: "Eesti",
  si: "Slovenščina",
  mt: "Malti",
  ga: "Gaeilge",
  ar: "العربية",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  hi: "हिन्दी",
  ru: "Русский",
  tr: "Türkçe",
  vi: "Tiếng Việt",
  th: "ไทย",
};

/* ── Nav link with active indicator ── */
function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "nav-link-ocean relative rounded-xl px-4 py-2 text-sm font-medium tracking-wide transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
        active ? "text-white" : "text-slate-400 hover:text-slate-200"
      )}
    >
      {label}
      {active && (
        <>
          <span className="nav-link-active-line" />
          <span className="nav-link-active-dot" />
        </>
      )}
    </Link>
  );
}

export function Navbar() {
  const [isMobileLocaleOpen, setIsMobileLocaleOpen] = useState(false);
  const [isDesktopLocaleOpen, setIsDesktopLocaleOpen] = useState(false);
  const mobileLocaleRef = useRef<HTMLDivElement>(null);
  const desktopLocaleRef = useRef<HTMLDivElement>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthView>("login");
  const openLogin = useCallback(() => {
    setAuthModalView("login");
    setAuthModalOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setAuthModalView("register");
    setAuthModalOpen(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileLocaleRef.current &&
        !mobileLocaleRef.current.contains(e.target as Node)
      ) {
        setIsMobileLocaleOpen(false);
      }
      if (
        desktopLocaleRef.current &&
        !desktopLocaleRef.current.contains(e.target as Node)
      ) {
        setIsDesktopLocaleOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const locale = useLocale();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tImages = useTranslations("images");
  const pathname = usePathname();
  const router = useRouter();

  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());
  const [hasAdmin, setHasAdmin] = useState(() => isAdmin());
  const checkAuth = useCallback(() => {
    setLoggedIn(isAuthenticated());
    setHasAdmin(isAdmin());
  }, []);

  useEffect(() => {
    window.addEventListener("auth-change", checkAuth);
    if (loggedIn && !isAdmin()) {
      authApi
        .me()
        .then((user) => {
          const profileComplete = !!(user.first_name && user.last_name);
          setCachedAuthState(user.role, profileComplete, 0);
          checkAuth();
        })
        .catch(() => {
          /* token expired or network error — silent */
        });
    }
    return () => window.removeEventListener("auth-change", checkAuth);
  }, [checkAuth, loggedIn, pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Token might already be invalid — ignore
    }
    clearToken();
    setLoggedIn(false);
    router.push("/");
  }, [router]);

  const handleLocaleChange = useCallback(
    (newLocale: string) => {
      router.replace(pathname, { locale: newLocale as Locale });
    },
    [router, pathname]
  );

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname?.startsWith(href) ?? false;
  };

  const NAV_LINKS = [
    { href: "/", label: t("home") },
    { href: "/centers", label: t("centers") },
    { href: "/blog", label: t("blog") },
    { href: "/about", label: t("about") },
  ] as const;

  return (
    <>
      {/* ── Desktop navbar ── */}
      <header className="fixed left-0 right-0 top-0 z-50 hidden md:block">
        <div className="mx-auto max-w-6xl px-4 pt-4 lg:px-6">
          <nav
            className="navbar-glass flex items-center justify-between rounded-2xl px-4 py-2 shadow-2xl shadow-black/40 lg:px-6"
            aria-label={t("mainNavigation")}
          >
            {/* ── Brand ── */}
            <Link
              href="/"
              className="navbar-logo inline-block outline-none transition-all focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:rounded-lg hover:opacity-90"
            >
              <Image
                src="/evidive-logo.png"
                alt={tImages("evidiveLogo")}
                width={120}
                height={36}
                sizes="100px"
                className="h-7 w-auto"
              />
            </Link>

            {/* ── Center: nav links ── */}
            <div className="flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={isActive(link.href)}
                />
              ))}
            </div>

            {/* ── Right: utilities + auth ── */}
            <div className="flex items-center gap-1.5">
              {/* Locale switcher */}
              <div className="relative" ref={desktopLocaleRef}>
                <button
                  type="button"
                  onClick={() => setIsDesktopLocaleOpen((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                    "outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
                    isDesktopLocaleOpen
                      ? "bg-white/10 text-white"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                  )}
                  aria-label={t("changeLanguage")}
                  aria-expanded={isDesktopLocaleOpen}
                >
                  <GlobeIcon className="h-3.5 w-3.5" />
                  <span>{locale}</span>
                </button>

                <AnimatePresence>
                  {isDesktopLocaleOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="navbar-locale-dropdown absolute right-0 top-full z-50 mt-2 max-h-72 w-48 overflow-y-auto overscroll-contain rounded-xl py-1"
                    >
                      {routing.locales.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            handleLocaleChange(loc);
                            setIsDesktopLocaleOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                            "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/70",
                            locale === loc
                              ? "bg-cyan-500/15 font-medium text-cyan-300"
                              : "text-white/60 hover:bg-white/8 hover:text-white"
                          )}
                        >
                          {LOCALE_NAMES[loc] ?? loc.toUpperCase()}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="mx-1 h-5 w-px bg-white/8" aria-hidden="true" />

              {/* Auth section */}
              {loggedIn ? (
                <div className="flex items-center gap-1">
                  {hasAdmin && (
                    <Link
                      href="/admin"
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                        "outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
                        isActive("/admin")
                          ? "bg-amber-500/15 text-amber-300"
                          : "text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-300"
                      )}
                    >
                      {t("admin")}
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                      "outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
                      isActive("/dashboard")
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-300"
                    )}
                  >
                    {t("dashboard")}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 outline-none transition-colors hover:bg-white/5 hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                  >
                    {tCommon("logout")}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openLogin}
                    className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                  >
                    {tCommon("login")}
                  </button>
                  <button
                    type="button"
                    onClick={openRegister}
                    className="navbar-cta rounded-xl px-4 py-1.5 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    {tCommon("register")}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── Mobile right side dock ── */}
      <motion.aside
        className="fixed right-2 top-[calc(15vh+3.5rem)] z-50 md:hidden"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        ref={mobileLocaleRef}
      >
        <div className="navbar-glass flex flex-col items-center gap-1 rounded-2xl p-1.5 shadow-xl shadow-black/30">
          {/* Locale */}
          <button
            type="button"
            onClick={() => setIsMobileLocaleOpen(!isMobileLocaleOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 outline-none transition-all active:scale-95 active:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            aria-label={t("changeLanguage")}
            aria-expanded={isMobileLocaleOpen}
          >
            <GlobeIcon />
          </button>

          <div className="mx-1 h-px w-6 bg-white/10" aria-hidden="true" />

          {/* Auth */}
          {loggedIn ? (
            <>
              {hasAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl outline-none transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400/70",
                    isActive("/admin")
                      ? "bg-cyan-500/15 text-cyan-400"
                      : "text-amber-400 active:bg-amber-500/10"
                  )}
                  aria-label={t("admin")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </Link>
              )}
              <Link
                href="/dashboard"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl outline-none transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400/70",
                  isActive("/dashboard")
                    ? "bg-cyan-500/15 text-cyan-400"
                    : "text-emerald-400 active:bg-emerald-500/10"
                )}
                aria-label={t("dashboard")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 outline-none transition-all active:scale-95 active:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                aria-label={tCommon("logout")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openLogin}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 outline-none transition-all active:scale-95 active:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              aria-label={tCommon("login")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          )}
        </div>

        {/* Locale dropdown (left of dock) */}
        <AnimatePresence>
          {isMobileLocaleOpen && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="navbar-locale-dropdown absolute right-full top-0 mr-2 max-h-72 w-44 overflow-y-auto overscroll-contain rounded-xl py-1"
            >
              {routing.locales.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    handleLocaleChange(loc);
                    setIsMobileLocaleOpen(false);
                  }}
                  className={cn(
                    "block w-full px-3 py-1.5 text-left text-xs transition-colors",
                    "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/70",
                    locale === loc
                      ? "bg-cyan-500/15 font-medium text-cyan-400"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {LOCALE_NAMES[loc] ?? loc.toUpperCase()}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label={t("mainNavigation")}
      >
        <div className="navbar-glass mx-2 mb-2 flex items-center justify-around rounded-2xl px-1 py-1.5 shadow-xl shadow-black/30">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
                  active
                    ? "text-cyan-300"
                    : "text-slate-500 active:text-slate-300"
                )}
              >
                <MobileNavIcon href={link.href} />
                {link.label}
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_6px_2px_hsla(185,100%,65%,0.6)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultView={authModalView}
      />
    </>
  );
}

/* ── Mobile tab bar icons ── */
function MobileNavIcon({ href }: { href: string }) {
  switch (href) {
    case "/":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "/centers":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "/blog":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      );
    case "/about":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      );
    default:
      return null;
  }
}
