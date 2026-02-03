"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, User, LogOut, LayoutDashboard, Building2, Settings } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/lib/i18n/use-translations";
import { useLocale } from "@/lib/i18n/locale-provider";
import { locales, localeNames, localeFlags } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tImages = useTranslations("images");
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  
  const isAuthenticated = status === "authenticated" && session?.user;
  const isAdmin = session?.user?.role === "ADMIN";

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/explorer", label: t("explorer") },
    { href: "/centers", label: t("centers") },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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
          {/* Logo */}
          <Link href="/" className="z-50 flex shrink-0 items-center group" aria-label={t("home")}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src="/evidive-logo.png"
                alt={tImages("evidiveLogo")}
                width={120}
                height={36}
                className="h-8 w-auto"
                priority
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex lg:gap-2">
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

          {/* Actions */}
          <div className="z-50 flex shrink-0 items-center gap-2 lg:gap-3">
            <div className="hidden items-center gap-1 md:flex md:gap-2">
              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
                  >
                    <Globe className="mr-1 h-4 w-4" />
                    {localeFlags[locale]} {localeNames[locale]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-white/15 bg-slate-900/95 backdrop-blur-xl">
                  {locales.map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => setLocale(loc)}
                      className={cn(
                        "cursor-pointer text-white/80 hover:text-white",
                        loc === locale && "font-semibold text-cyan-400"
                      )}
                    >
                      <span className="mr-2">{localeFlags[loc]}</span>
                      {localeNames[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Auth buttons / User menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="hidden xl:inline">{session.user.name || session.user.email?.split("@")[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-white/15 bg-slate-900/95 backdrop-blur-xl">
                    <div className="px-2 py-2">
                      <p className="text-sm font-medium text-white">{session.user.name || tCommon("user")}</p>
                      <p className="text-xs text-white/60">{session.user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="cursor-pointer text-white/80 hover:text-white">
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {t("dashboard")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer text-white/80 hover:text-white">
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t("profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer text-white/80 hover:text-white">
                      <Link href="/onboard/center" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {t("myCenters")}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem asChild className="cursor-pointer text-amber-400 hover:text-amber-300">
                          <Link href="/admin" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            {t("adminPanel")}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="cursor-pointer text-red-400 hover:text-red-300"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {tCommon("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    asChild
                  >
                    <Link href="/register">{tCommon("register")}</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-white hover:bg-white/10"
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-white/10 bg-black/90 backdrop-blur-xl">
                  {locales.map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => setLocale(loc)}
                      className={cn(
                        "cursor-pointer",
                        loc === locale && "font-semibold text-cyan-400"
                      )}
                    >
                      <span className="mr-2">{localeFlags[loc]}</span>
                      {localeNames[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-white hover:bg-white/10"
                onClick={toggleMobileMenu}
                aria-label={t("toggleMobileMenu")}
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
            className="fixed inset-x-4 top-24 z-40 overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl shadow-black/40 backdrop-blur-2xl md:hidden"
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

              <div className="flex flex-col gap-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <div className="mb-2 rounded-xl bg-white/5 p-3">
                      <p className="text-sm font-medium text-white">{session.user.name || tCommon("user")}</p>
                      <p className="text-xs text-white/60">{session.user.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={toggleMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {t("dashboard")}
                      </Button>
                    </Link>
                    <Link href="/profile" onClick={toggleMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
                      >
                        <User className="h-4 w-4" />
                        {t("profile")}
                      </Button>
                    </Link>
                    <Link href="/onboard/center" onClick={toggleMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
                      >
                        <Building2 className="h-4 w-4" />
                        {t("myCenters")}
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={toggleMobileMenu}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2 rounded-xl text-amber-400 hover:bg-white/15 hover:text-amber-300"
                        >
                          <Settings className="h-4 w-4" />
                          {t("adminPanel")}
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        toggleMobileMenu();
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full justify-start gap-2 rounded-xl text-red-400 hover:bg-white/15 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4" />
                      {tCommon("logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={toggleMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-center rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
                      >
                        {tCommon("login")}
                      </Button>
                    </Link>
                    <Link href="/register" onClick={toggleMobileMenu}>
                      <Button
                        className="w-full justify-center rounded-xl bg-cyan-500 font-semibold text-slate-900 hover:bg-cyan-400"
                      >
                        {tCommon("register")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
