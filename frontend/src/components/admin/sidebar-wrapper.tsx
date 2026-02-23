"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";

type SidebarWrapperProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  title: string;
};

export function SidebarWrapper({ sidebar, children, title }: SidebarWrapperProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("common");
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-slate-950 p-2 pt-0 text-slate-100 md:p-3 md:pt-0 lg:p-4 lg:pt-0">
      {/* Floating glass panel */}
      <div className="navbar-glass mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-60 lg:shrink-0">
          <div className="flex h-full w-full flex-col border-r border-white/[0.06]">
            {sidebar}
          </div>
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="navbar-glass relative h-full rounded-r-2xl shadow-xl shadow-black/40">
            {sidebar}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label={t("closeMenu")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 sm:px-5">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label={t("openMenu")}
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <h1 className="text-sm font-semibold tracking-wide text-white">
              {title}
            </h1>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
            <div className="mx-auto w-full max-w-5xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
