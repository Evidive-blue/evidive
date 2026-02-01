"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Waves,
  Shield,
  Building2,
  Store,
  Calendar,
} from "lucide-react";
import type { Session } from "next-auth";
import type { Locale } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardStore } from "@/stores/onboard-store";

interface UserMenuProps {
  session: Session;
  locale: Locale;
}

function getUserTypeLabels(t: (key: string) => string): Record<string, { label: string; color: string }> {
  return {
    DIVER: { label: t("diver"), color: "bg-cyan-500/20 text-cyan-300" },
    SELLER: { label: t("seller"), color: "bg-emerald-500/20 text-emerald-300" },
    CENTER_OWNER: { label: t("center"), color: "bg-blue-500/20 text-blue-300" },
    ADMIN: { label: t("admin"), color: "bg-purple-500/20 text-purple-300" },
  };
}

export function UserMenu({ session, locale }: UserMenuProps) {
  const t = useTranslations("nav");
  const tUserTypes = useTranslations("userTypes");
  const tImages = useTranslations("images");
  const { openDrawer } = useOnboardStore();
  const user = session.user;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || "?";

  const userTypeInfo = getUserTypeLabels(tUserTypes)[user.userType] || getUserTypeLabels(tUserTypes).DIVER;

  const handleSignOut = () => {
    signOut({ callbackUrl: `/${locale}/login` }); // callbackUrl needs full path for next-auth
  };

  const handleUpgrade = (type: "seller" | "center") => {
    openDrawer({
      intent: "upgrade",
      type,
      step: type === "seller" ? "profile" : "info",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex h-9 items-center gap-2 rounded-xl px-2 text-white/90 hover:bg-white/15 hover:text-white"
        >
          {/* Avatar */}
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white">
            {user.image ? (
              <Image
                src={user.image}
                alt={tImages("avatar")}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {/* Name - hidden on small screens */}
          <span className="hidden max-w-[100px] truncate text-sm font-medium xl:block">
            {user.name || user.email?.split("@")[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 border-white/15 bg-slate-900/95 backdrop-blur-xl"
      >
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-white/90">
              {user.name || "Utilisateur"}
            </p>
            <p className="text-xs text-white/60 truncate">{user.email}</p>
            <span
              className={cn(
                "mt-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
                userTypeInfo.color
              )}
            >
              {userTypeInfo.label}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Menu Items */}
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard"
            className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>{t("dashboard")}</span>
          </Link>
        </DropdownMenuItem>

        {(user.userType === "DIVER" || user.userType === "SELLER") && (
          <DropdownMenuItem asChild>
            <Link
              href="/bookings"
              className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
            >
              <Calendar className="h-4 w-4" />
              <span>{t("myBookings")}</span>
            </Link>
          </DropdownMenuItem>
        )}

        {user.userType === "CENTER_OWNER" ? (
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/center"
              className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
            >
              <Building2 className="h-4 w-4" />
              <span>{t("myCenter")}</span>
            </Link>
          </DropdownMenuItem>
        ) : null}

        {user.userType === "SELLER" ? (
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/seller"
              className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
            >
              <Waves className="h-4 w-4" />
              <span>{t("sellerView")}</span>
            </Link>
          </DropdownMenuItem>
        ) : null}

        {user.userType === "DIVER" ? (
          <>
            <DropdownMenuItem
              onSelect={() => handleUpgrade("seller")}
              className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
            >
              <Store className="h-4 w-4" />
              <span>{t("becomeSeller")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleUpgrade("center")}
              className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
            >
              <Building2 className="h-4 w-4" />
              <span>{t("createCenter")}</span>
            </DropdownMenuItem>
          </>
        ) : null}

        {user.userType === "SELLER" ? (
          <DropdownMenuItem
            onSelect={() => handleUpgrade("center")}
            className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
          >
            <Building2 className="h-4 w-4" />
            <span>{t("createCenter")}</span>
          </DropdownMenuItem>
        ) : null}

        {user.userType === "ADMIN" ? (
          <>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/centers"
                className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
              >
                <Shield className="h-4 w-4" />
                <span>{t("adminCenters")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/users"
                className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
              >
                <Shield className="h-4 w-4" />
                <span>{t("adminUsers")}</span>
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
          >
            <User className="h-4 w-4" />
            <span>{t("myProfile")}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/explorer"
            className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
          >
            <Waves className="h-4 w-4" />
            <span>{t("explorer")}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="flex cursor-pointer items-center gap-2 text-white/80 hover:text-white focus:text-white"
          >
            <Settings className="h-4 w-4" />
            <span>{t("settings")}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
