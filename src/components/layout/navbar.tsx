"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { EviDiveLogo } from "@/components/ui/evidive-logo";
import { UserMenu } from "./user-menu";
import { useOnboardStore } from "@/stores/onboard-store";

interface NavbarProps {
  locale: Locale;
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tImages = useTranslations("images");
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated" && session;
  const { openDrawer } = useOnboardStore();

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/explorer", label: t("explorer") },
    { href: "/centers", label: t("centers") },
  ];

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href === "/" ? "" : href}`;
    if (href === "/") return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(fullPath);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const openRegisterDrawer = () => {
    openDrawer({ intent: "register", type: "role", step: null });
  };
  const openUpgradeDrawer = (type: "seller" | "center") => {
    openDrawer({
      intent: "upgrade",
      type,
      step: type === "seller" ? "profile" : "info",
    });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="container mx-auto px-4 pt-4">
        {/* Floating Pill Navbar */}
        <motion.div
          className="flex h-16 items-center justify-between rounded-2xl border border-white/10 bg-black/80 px-6 shadow-lg shadow-black/20 backdrop-blur-xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo - shrink-0 pour ne pas se compresser */}
          <Link href="/" className="z-50 flex shrink-0 items-center group" aria-label={t("home")}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <EviDiveLogo size="md" />
            </motion.div>
          </Link>

          {/* Desktop Navigation - flex-1 pour centrage naturel, lg: pour éviter chevauchement */}
          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative whitespace-nowrap px-2 py-2 text-sm font-medium transition-all lg:px-3 xl:px-4",
                  isActive(item.href)
                    ? "text-cyan-400"
                    : "text-slate-300 hover:text-white"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-cyan-400 transition-all duration-300",
                    isActive(item.href)
                      ? "w-3/4"
                      : "w-0 group-hover:w-3/4"
                  )}
                />
              </Link>
            ))}
          </nav>

          {/* Actions - flex-shrink-0 pour ne pas se compresser */}
          <div className="z-50 flex shrink-0 items-center gap-2 lg:gap-3">
            <div className="hidden items-center gap-1 lg:flex lg:gap-2">
              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
                  >
                    <Globe className="mr-1 h-4 w-4" />
                    {localeNames[locale]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-white/15 bg-slate-900/95 backdrop-blur-xl">
                  {locales.map((loc) => (
                    <DropdownMenuItem key={loc} asChild>
                      <a
                        href={`/${loc}${pathname.replace(`/${locale}`, "") || "/"}`}
                        className={cn(
                          "cursor-pointer text-white/80 hover:text-white",
                          loc === locale && "font-semibold text-cyan-400"
                        )}
                      >
                        {localeNames[loc]}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {status === "loading" ? (
                <div className="h-9 w-20 animate-pulse rounded-xl bg-white/10" />
              ) : isAuthenticated ? (
                <UserMenu session={session} locale={locale} />
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
                    asChild
                  >
                    <Link href="/login">{tCommon("login")}</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-xl bg-cyan-500 font-semibold text-slate-900 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400 hover:shadow-cyan-500/30"
                    onClick={openRegisterDrawer}
                  >
                    {tCommon("register")}
                  </Button>
                </>
              )}
            </div>

            {/* Mobile/Tablet Menu Toggle - visible jusqu'à lg */}
            <div className="flex items-center gap-2 lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-white hover:bg-white/10"
                    aria-label={tCommon("search")}
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-white/10 bg-black/90 backdrop-blur-xl">
                  {locales.map((loc) => (
                    <DropdownMenuItem key={loc} asChild>
                      <a
                        href={`/${loc}${pathname.replace(`/${locale}`, "") || "/"}`}
                        className={cn(
                          "cursor-pointer",
                          loc === locale && "font-semibold text-cyan-400"
                        )}
                      >
                        {localeNames[loc]}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-white hover:bg-white/10"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-24 z-40 overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl shadow-black/40 backdrop-blur-2xl lg:hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={toggleMobileMenu}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                    isActive(item.href)
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}

              <div className="my-2 h-px bg-white/15" />

              {status === "loading" ? (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="h-16 animate-pulse rounded-xl bg-white/10" />
                </div>
              ) : isAuthenticated ? (
                <div className="flex flex-col gap-2 pt-2">
                  {/* User Info */}
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-semibold text-white">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={tImages("avatar")}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        session.user.name?.charAt(0).toUpperCase() ||
                        session.user.email?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white/90">
                        {session.user.name || tCommon("dashboard")}
                      </p>
                      <p className="truncate text-xs text-white/60">
                        {session.user.email}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Menu Links */}
                  <Link href="/dashboard" onClick={toggleMobileMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {t("dashboard")}
                    </Button>
                  </Link>
                  {(session.user.userType === "DIVER" || session.user.userType === "SELLER") && (
                    <Link href="/bookings" onClick={toggleMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        {t("myBookings")}
                      </Button>
                    </Link>
                  )}
                  {session.user.userType === "CENTER_OWNER" ? (
                    <Link href="/dashboard/center" onClick={toggleMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        {t("myCenter")}
                      </Button>
                    </Link>
                  ) : null}
                  {session.user.userType === "SELLER" ? (
                    <Link href="/dashboard/seller" onClick={toggleMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        {t("sellerView")}
                      </Button>
                    </Link>
                  ) : null}
                  {session.user.userType === "DIVER" ? (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          toggleMobileMenu();
                          openUpgradeDrawer("seller");
                        }}
                      >
                        {t("becomeSeller")}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          toggleMobileMenu();
                          openUpgradeDrawer("center");
                        }}
                      >
                        {t("createCenter")}
                      </Button>
                    </>
                  ) : null}
                  {session.user.userType === "SELLER" ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                      onClick={() => {
                        toggleMobileMenu();
                        openUpgradeDrawer("center");
                      }}
                    >
                      {t("createCenter")}
                    </Button>
                  ) : null}
                  {session.user.userType === "ADMIN" ? (
                    <>
                      <Link href="/admin/centers" onClick={toggleMobileMenu}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                        >
                          {t("adminCenters")}
                        </Button>
                      </Link>
                      <Link href="/admin/users" onClick={toggleMobileMenu}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                        >
                          {t("adminUsers")}
                        </Button>
                      </Link>
                    </>
                  ) : null}
                  <Link href="/profile" onClick={toggleMobileMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {t("myProfile")}
                    </Button>
                  </Link>

                  <div className="my-1 h-px bg-white/10" />

                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => {
                      toggleMobileMenu();
                      import("next-auth/react").then(({ signOut }) => {
                        signOut({ callbackUrl: `/${locale}/login` });
                      });
                    }}
                  >
                    {t("logout")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link href="/login" onClick={toggleMobileMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-center rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
                    >
                      {tCommon("login")}
                    </Button>
                  </Link>
                  <Button
                    className="w-full justify-center rounded-xl bg-cyan-500 font-semibold text-slate-900 hover:bg-cyan-400"
                    onClick={() => {
                      toggleMobileMenu();
                      openRegisterDrawer();
                    }}
                  >
                    {tCommon("register")}
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
