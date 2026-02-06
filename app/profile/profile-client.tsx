"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n/use-translations";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Waves,
  Calendar,
  Star,
  Building2,
  Save,
  Loader2,
  CheckCircle,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ProfileData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  role: string;
  certificationLevel: string | null;
  certificationOrg: string | null;
  totalDives: number | null;
  preferredLanguage: string | null;
  emailNotifications: boolean;
  smsNotifications: boolean;
  timezone: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  _count: {
    centers: number;
    bookings: number;
    reviews: number;
  };
}

interface ProfileClientProps {
  initialProfile: ProfileData;
}

const CERTIFICATION_LEVELS = [
  "none",
  "openWater",
  "advancedOpenWater",
  "rescueDiver",
  "divemaster",
  "instructor",
] as const;

const CERTIFICATION_ORGS = ["PADI", "SSI", "NAUI", "CMAS", "BSAC", "SDI", "TDI", "Other"] as const;

export function ProfileClient({ initialProfile }: ProfileClientProps) {
  const t = useTranslations("profile");
  const tOnboard = useTranslations("onboardDiver");
  const tCommon = useTranslations("common");

  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    displayName: profile.displayName || "",
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    bio: profile.bio || "",
    phone: profile.phone || "",
    address: profile.address || "",
    city: profile.city || "",
    zip: profile.zip || "",
    country: profile.country || "",
    certificationLevel: profile.certificationLevel || "",
    certificationOrg: profile.certificationOrg || "",
    totalDives: profile.totalDives?.toString() || "",
    emailNotifications: profile.emailNotifications,
    smsNotifications: profile.smsNotifications,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/diver/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.displayName || null,
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
          bio: formData.bio || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          zip: formData.zip || null,
          country: formData.country || null,
          certificationLevel: formData.certificationLevel || null,
          certificationOrg: formData.certificationOrg || null,
          totalDives: formData.totalDives ? parseInt(formData.totalDives) : null,
          notificationPreferences: {
            email: formData.emailNotifications,
            sms: formData.smsNotifications,
            push: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const data = await response.json();
      setProfile((prev) => ({
        ...prev,
        ...data.profile,
        createdAt: prev.createdAt,
        _count: prev._count,
      }));
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: profile.displayName || "",
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      bio: profile.bio || "",
      phone: profile.phone || "",
      address: profile.address || "",
      city: profile.city || "",
      zip: profile.zip || "",
      country: profile.country || "",
      certificationLevel: profile.certificationLevel || "",
      certificationOrg: profile.certificationOrg || "",
      totalDives: profile.totalDives?.toString() || "",
      emailNotifications: profile.emailNotifications,
      smsNotifications: profile.smsNotifications,
    });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
              <p className="text-white/60">{t("subtitle")}</p>
            </div>
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
            >
              <Edit2 className="h-4 w-4" />
              {t("edit")}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                {tCommon("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("save")}
              </Button>
            </div>
          )}
        </div>

        {/* Success/Error messages */}
        {saveSuccess && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-400">
            <CheckCircle className="h-5 w-5" />
            {t("saveSuccess")}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <Waves className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{profile.totalDives || 0}</p>
                <p className="text-sm text-white/60">{t("stats.totalDives")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{profile._count.bookings}</p>
                <p className="text-sm text-white/60">{t("stats.bookings")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                <Star className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{profile._count.reviews}</p>
                <p className="text-sm text-white/60">{t("stats.reviews")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="space-y-6">
          {/* Personal Info */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <User className="h-5 w-5 text-cyan-400" />
              {t("sections.personal")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("fields.displayName")}</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange("displayName", e.target.value)}
                  disabled={!isEditing}
                  placeholder={t("placeholders.displayName")}
                  className={cn(!isEditing && "opacity-60")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("fields.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="pl-10 opacity-60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("fields.firstName")}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  disabled={!isEditing}
                  placeholder={t("placeholders.firstName")}
                  className={cn(!isEditing && "opacity-60")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("fields.lastName")}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  disabled={!isEditing}
                  placeholder={t("placeholders.lastName")}
                  className={cn(!isEditing && "opacity-60")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio">{t("fields.bio")}</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  disabled={!isEditing}
                  placeholder={t("placeholders.bio")}
                  rows={3}
                  className={cn(!isEditing && "opacity-60")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("fields.phone")}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                    placeholder={t("placeholders.phone")}
                    className={cn("pl-10", !isEditing && "opacity-60")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <MapPin className="h-5 w-5 text-cyan-400" />
              {t("sections.address")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">{t("fields.address")}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!isEditing}
                  placeholder={t("placeholders.address")}
                  className={cn(!isEditing && "opacity-60")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t("fields.city")}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  disabled={!isEditing}
                  placeholder={t("placeholders.city")}
                  className={cn(!isEditing && "opacity-60")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">{t("fields.zip")}</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleInputChange("zip", e.target.value)}
                  disabled={!isEditing}
                  placeholder={t("placeholders.zip")}
                  className={cn(!isEditing && "opacity-60")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t("fields.country")}</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  disabled={!isEditing}
                  placeholder={t("placeholders.country")}
                  className={cn(!isEditing && "opacity-60")}
                />
              </div>
            </div>
          </div>

          {/* Diving Info */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <Award className="h-5 w-5 text-cyan-400" />
              {t("sections.diving")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="certificationLevel">{t("fields.certificationLevel")}</Label>
                <Select
                  value={formData.certificationLevel}
                  onValueChange={(v) => handleInputChange("certificationLevel", v)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={cn(!isEditing && "opacity-60")}>
                    <SelectValue placeholder={t("placeholders.certificationLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATION_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {tOnboard(`certificationLevels.${level}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificationOrg">{t("fields.certificationOrg")}</Label>
                <Select
                  value={formData.certificationOrg}
                  onValueChange={(v) => handleInputChange("certificationOrg", v)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={cn(!isEditing && "opacity-60")}>
                    <SelectValue placeholder={t("placeholders.certificationOrg")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATION_ORGS.map((org) => (
                      <SelectItem key={org} value={org}>
                        {org}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalDives">{t("fields.totalDives")}</Label>
                <div className="relative">
                  <Waves className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="totalDives"
                    type="number"
                    min="0"
                    value={formData.totalDives}
                    onChange={(e) => handleInputChange("totalDives", e.target.value)}
                    disabled={!isEditing}
                    placeholder="0"
                    className={cn("pl-10", !isEditing && "opacity-60")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <Building2 className="h-5 w-5 text-cyan-400" />
              {t("sections.notifications")}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="font-medium text-white">{t("notifications.email")}</p>
                  <p className="text-sm text-white/60">{t("notifications.emailDesc")}</p>
                </div>
                <Switch
                  checked={formData.emailNotifications}
                  onCheckedChange={(v) => handleInputChange("emailNotifications", v)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="font-medium text-white">{t("notifications.sms")}</p>
                  <p className="text-sm text-white/60">{t("notifications.smsDesc")}</p>
                </div>
                <Switch
                  checked={formData.smsNotifications}
                  onCheckedChange={(v) => handleInputChange("smsNotifications", v)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-semibold text-white">{t("sections.account")}</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-white/60">{t("account.memberSince")}</p>
                <p className="font-medium text-white">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-white/60">{t("account.emailVerified")}</p>
                <p className="font-medium text-white">
                  {profile.emailVerified ? (
                    <span className="text-green-400">{tCommon("yes")}</span>
                  ) : (
                    <span className="text-amber-400">{tCommon("no")}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-white/60">{t("account.role")}</p>
                <p className="font-medium text-white capitalize">{profile.role.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-white/60">{t("account.centers")}</p>
                <p className="font-medium text-white">{profile._count.centers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
