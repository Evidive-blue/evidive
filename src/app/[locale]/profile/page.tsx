"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import {
  User,
  Phone,
  MapPin,
  Award,
  Waves,
  Camera,
  ChevronLeft,
  Save,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const certificationLevels = [
  { value: "none", label: "Non certifié" },
  { value: "open_water", label: "Open Water" },
  { value: "advanced", label: "Advanced Open Water" },
  { value: "rescue", label: "Rescue Diver" },
  { value: "divemaster", label: "Divemaster" },
  { value: "instructor", label: "Instructor" },
];

const certificationOrgs = [
  { value: "padi", label: "PADI" },
  { value: "ssi", label: "SSI" },
  { value: "naui", label: "NAUI" },
  { value: "cmas", label: "CMAS" },
  { value: "bsac", label: "BSAC" },
  { value: "other", label: "Autre" },
];

const userTypeLabels: Record<string, { label: string; color: string }> = {
  DIVER: { label: "Plongeur", color: "bg-cyan-500/20 text-cyan-300" },
  SELLER: { label: "Vendeur", color: "bg-emerald-500/20 text-emerald-300" },
  CENTER_OWNER: { label: "Centre", color: "bg-blue-500/20 text-blue-300" },
  ADMIN: { label: "Admin", color: "bg-purple-500/20 text-purple-300" },
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tImages = useTranslations("images");
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    bio: "",
    certificationLevel: "none",
    certificationOrg: "padi",
    totalDives: 0,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/login`);
    }
  }, [status, router, locale]);

  if (status === "unauthenticated" || status === "loading") {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const user = session?.user;
  const userTypeInfo = userTypeLabels[user?.userType || "DIVER"];

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement API call to update profile
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("backToDashboard")}
            </Button>
          </Link>
        </motion.div>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="mb-6 overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-cyan-500/30 via-blue-600/30 to-purple-600/30" />

            <CardContent className="relative px-6 pb-6">
              {/* Avatar */}
              <div className="absolute -top-16 left-6">
                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-slate-900 bg-gradient-to-br from-cyan-500 to-blue-600 text-4xl font-bold text-white">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={tImages("avatar")}
                        width={128}
                        height={128}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg transition-transform hover:scale-110">
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* User Info */}
              <div className="ml-0 pt-20 sm:ml-40 sm:pt-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {user?.name || t("defaultName")}
                    </h1>
                    <p className="text-white/60">{user?.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                          userTypeInfo.color
                        )}
                      >
                        {userTypeInfo.label}
                      </span>
                      {user?.isEmailVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                          <Shield className="h-3 w-3" />
                          {t("emailVerified")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                    disabled={isSaving}
                    className={cn(
                      isEditing
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                        : "border-white/20 text-white/80 hover:bg-white/10"
                    )}
                    variant={isEditing ? "default" : "outline"}
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {t("saving")}
                      </>
                    ) : isEditing ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t("saveChanges")}
                      </>
                    ) : (
                      t("editProfile")
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5 text-cyan-400" />
                  {t("sections.personal")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/70">
                      {t("fields.firstName")}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        placeholder={t("placeholders.firstName")}
                      />
                    ) : (
                      <p className="text-white">{formData.firstName || "-"}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/70">
                      {t("fields.lastName")}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        placeholder={t("placeholders.lastName")}
                      />
                    ) : (
                      <p className="text-white">{formData.lastName || "-"}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    <Phone className="mr-1.5 inline h-4 w-4" />
                    {t("fields.phone")}
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      placeholder={t("placeholders.phone")}
                    />
                  ) : (
                    <p className="text-white">{formData.phone || "-"}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    <MapPin className="mr-1.5 inline h-4 w-4" />
                    {t("fields.location")}
                  </label>
                  {isEditing ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        placeholder={t("placeholders.city")}
                      />
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        placeholder={t("placeholders.country")}
                      />
                    </div>
                  ) : (
                    <p className="text-white">
                      {formData.city && formData.country
                        ? `${formData.city}, ${formData.country}`
                        : "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    {t("fields.bio")}
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      placeholder={t("placeholders.bio")}
                    />
                  ) : (
                    <p className="text-white">{formData.bio || "-"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Diving Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="h-5 w-5 text-cyan-400" />
                  {t("sections.diving")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    {t("fields.certificationLevel")}
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.certificationLevel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          certificationLevel: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      {certificationLevels.map((level) => (
                        <option
                          key={level.value}
                          value={level.value}
                          className="bg-slate-900"
                        >
                          {level.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-white">
                      {certificationLevels.find(
                        (l) => l.value === formData.certificationLevel
                      )?.label || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    {t("fields.certificationOrg")}
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.certificationOrg}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          certificationOrg: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      {certificationOrgs.map((org) => (
                        <option
                          key={org.value}
                          value={org.value}
                          className="bg-slate-900"
                        >
                          {org.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-white">
                      {certificationOrgs.find(
                        (o) => o.value === formData.certificationOrg
                      )?.label || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    <Waves className="mr-1.5 inline h-4 w-4" />
                    {t("fields.totalDives")}
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={formData.totalDives}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalDives: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-white">{formData.totalDives}</p>
                  )}
                </div>

                {/* Stats Card */}
                <div className="mt-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-4">
                  <h4 className="mb-3 text-sm font-medium text-white/70">
                    {t("divingStats.title")}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-cyan-400">0</p>
                      <p className="text-xs text-white/60">{t("divingStats.bookings")}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">0</p>
                      <p className="text-xs text-white/60">{t("divingStats.reviews")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="mt-6 border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  {t("sections.account")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{t("account.email")}</span>
                    <span className="text-sm text-white">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{t("account.type")}</span>
                    <span className={cn("text-sm rounded-full px-2 py-0.5", userTypeInfo.color)}>
                      {userTypeInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{t("account.status")}</span>
                    <span className="text-sm text-emerald-400">{t("account.active")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
