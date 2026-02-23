"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  adminApi,
  type AdminSettingsMarketplace,
  type AdminSettingsCompany,
  type AdminSettingsCurrency,
  type AdminSettingsDisplay,
  type AdminSettingsGlobal,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";

type TabId = "marketplace" | "company" | "currency" | "display" | "global";

export function AdminSettingsClient() {
  const t = useTranslations("admin");
  const [activeTab, setActiveTab] = useState<TabId>("marketplace");

  return (
    <div className="space-y-6">
      <PageHeader titleKey="settings" />
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800">
        {(
          [
            { id: "marketplace" as TabId, key: "settingsMarketplace" },
            { id: "company" as TabId, key: "settingsCompany" },
            { id: "currency" as TabId, key: "settingsCurrency" },
            { id: "display" as TabId, key: "settingsDisplay" },
            { id: "global" as TabId, key: "settingsGlobal" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-cyan-500 text-cyan-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t(tab.key)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        {activeTab === "marketplace" && <MarketplaceTab />}
        {activeTab === "company" && <CompanyTab />}
        {activeTab === "currency" && <CurrencyTab />}
        {activeTab === "display" && <DisplayTab />}
        {activeTab === "global" && <GlobalTab />}
      </div>
    </div>
  );
}

// ─── Marketplace Tab ───
function MarketplaceTab() {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AdminSettingsMarketplace | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await adminApi.getSettingsMarketplace();
        setData(result);
      } catch {
        toast.error(
          t("loadError")
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const handleSave = async () => {
    if (!data) {return;}
    setSaving(true);
    try {
      await adminApi.updateSettingsMarketplace(data);
      toast.success(t("settingsUpdated"));
    } catch {
      toast.error(
        t("saveError")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={2} />;
  }

  if (!data) {return null;}

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">{t("settingsTabMarketplace")}</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("settingsCommissionRate")}
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={data.commission_rate}
            onChange={(e) =>
              setData({ ...data, commission_rate: parseFloat(e.target.value) || 0 })
            }
            className="bg-slate-800 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("bookingAdvanceDays")}
          </label>
          <Input
            type="number"
            min="0"
            value={data.booking_advance_days}
            onChange={(e) =>
              setData({ ...data, booking_advance_days: parseInt(e.target.value) || 0 })
            }
            className="bg-slate-800 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("settingsCancellationHours")}
          </label>
          <Input
            type="number"
            min="0"
            value={data.cancellation_hours}
            onChange={(e) =>
              setData({ ...data, cancellation_hours: parseInt(e.target.value) || 0 })
            }
            className="bg-slate-800 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("minBookingNoticeHours")}
          </label>
          <Input
            type="number"
            min="0"
            value={data.min_booking_notice_hours}
            onChange={(e) =>
              setData({
                ...data,
                min_booking_notice_hours: parseInt(e.target.value) || 0,
              })
            }
            className="bg-slate-800 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("maxParticipantsPerBooking")}
          </label>
          <Input
            type="number"
            min="1"
            value={data.max_participants_per_booking}
            onChange={(e) =>
              setData({
                ...data,
                max_participants_per_booking: parseInt(e.target.value) || 1,
              })
            }
            className="bg-slate-800 text-white"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <label className="text-sm font-medium text-slate-300">
              {t("settingsAutoApproveCenters")}
            </label>
            <p className="text-xs text-slate-500">{t("settingsAutoApproveCentersDesc")}</p>
          </div>
          <Switch
            checked={data.auto_approve_centers}
            onCheckedChange={(checked) =>
              setData({ ...data, auto_approve_centers: checked })
            }
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? t("loading") : t("save")}
        </Button>
      </div>
    </div>
  );
}

// ─── Company Tab ───
function CompanyTab() {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AdminSettingsCompany | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await adminApi.getSettingsCompany();
        setData(result);
      } catch {
        toast.error(
          t("loadError")
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const handleSave = async () => {
    if (!data) {return;}
    setSaving(true);
    try {
      await adminApi.updateSettingsCompany(data);
      toast.success(t("settingsUpdated"));
    } catch {
      toast.error(
        t("saveError")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={2} />;
  }

  if (!data) {return null;}

  const fields: Array<{
    key: keyof AdminSettingsCompany;
    labelKey: string;
    type?: "text" | "email" | "tel" | "url";
  }> = [
    { key: "company_name", labelKey: "companyName" },
    { key: "legal_name", labelKey: "legalName" },
    { key: "address", labelKey: "address" },
    { key: "city", labelKey: "city" },
    { key: "zip", labelKey: "zip" },
    { key: "country", labelKey: "country" },
    { key: "phone", labelKey: "phone", type: "tel" },
    { key: "email", labelKey: "email", type: "email" },
    { key: "website", labelKey: "website", type: "url" },
    { key: "vat_number", labelKey: "vatNumber" },
    { key: "registration_number", labelKey: "registrationNumber" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">{t("settingsCompany")}</h3>
      <div className="grid gap-6 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium text-slate-300">{t(field.labelKey)}</label>
            <Input
              type={field.type || "text"}
              value={data[field.key]}
              onChange={(e) => setData({ ...data, [field.key]: e.target.value })}
              className="bg-slate-800 text-white"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? t("loading") : t("save")}
        </Button>
      </div>
    </div>
  );
}

// ─── Currency Tab ───
function CurrencyTab() {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AdminSettingsCurrency | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await adminApi.getSettingsCurrency();
        setData(result);
      } catch {
        toast.error(
          t("loadError")
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const handleSave = async () => {
    if (!data) {return;}
    setSaving(true);
    try {
      await adminApi.updateSettingsCurrency(data);
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(
        t("saveError")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={2} />;
  }

  if (!data) {return null;}

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">{t("settingsCurrency")}</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("defaultCurrency")}
          </label>
          <Select
            value={data.default_currency}
            onValueChange={(value) => setData({ ...data, default_currency: value })}
          >
            <SelectTrigger className="bg-slate-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("displayFormat")}
          </label>
          <Input
            type="text"
            value={data.display_format}
            onChange={(e) => setData({ ...data, display_format: e.target.value })}
            className="bg-slate-800 text-white"
            placeholder="€{amount}"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("decimalSeparator")}
          </label>
          <Input
            type="text"
            maxLength={1}
            value={data.decimal_separator}
            onChange={(e) => setData({ ...data, decimal_separator: e.target.value })}
            className="bg-slate-800 text-white"
            placeholder="."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("thousandSeparator")}
          </label>
          <Input
            type="text"
            maxLength={1}
            value={data.thousand_separator}
            onChange={(e) => setData({ ...data, thousand_separator: e.target.value })}
            className="bg-slate-800 text-white"
            placeholder=","
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? t("loading") : t("save")}
        </Button>
      </div>
    </div>
  );
}

// ─── Display Tab ───
function DisplayTab() {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AdminSettingsDisplay | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await adminApi.getSettingsDisplay();
        setData(result);
      } catch {
        toast.error(
          t("loadError")
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const handleSave = async () => {
    if (!data) {return;}
    setSaving(true);
    try {
      await adminApi.updateSettingsDisplay(data);
      toast.success(t("settingsUpdated"));
    } catch {
      toast.error(
        t("saveError")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={2} />;
  }

  if (!data) {return null;}

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">{t("settingsDisplay")}</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("centersPerPage")}
          </label>
          <Input
            type="number"
            min="1"
            value={data.centers_per_page}
            onChange={(e) =>
              setData({ ...data, centers_per_page: parseInt(e.target.value) || 1 })
            }
            className="bg-slate-800 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("servicesPerPage")}
          </label>
          <Input
            type="number"
            min="1"
            value={data.services_per_page}
            onChange={(e) =>
              setData({ ...data, services_per_page: parseInt(e.target.value) || 1 })
            }
            className="bg-slate-800 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("reviewsPerPage")}
          </label>
          <Input
            type="number"
            min="1"
            value={data.reviews_per_page}
            onChange={(e) =>
              setData({ ...data, reviews_per_page: parseInt(e.target.value) || 1 })
            }
            className="bg-slate-800 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("defaultLocale")}
          </label>
          <Select
            value={data.default_locale}
            onValueChange={(value) => setData({ ...data, default_locale: value })}
          >
            <SelectTrigger className="bg-slate-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="nl">Nederlands</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <label className="text-sm font-medium text-slate-300">{t("showMap")}</label>
            <p className="text-xs text-slate-500">{t("showMap")}</p>
          </div>
          <Switch
            checked={data.show_map}
            onCheckedChange={(checked) => setData({ ...data, show_map: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <label className="text-sm font-medium text-slate-300">
              {t("showRatings")}
            </label>
            <p className="text-xs text-slate-500">{t("showRatings")}</p>
          </div>
          <Switch
            checked={data.show_ratings}
            onCheckedChange={(checked) => setData({ ...data, show_ratings: checked })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? t("loading") : t("save")}
        </Button>
      </div>
    </div>
  );
}

// ─── Global Tab ───
function GlobalTab() {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AdminSettingsGlobal | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await adminApi.getSettingsGlobal();
        setData(result);
      } catch {
        toast.error(
          t("loadError")
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const handleSave = async () => {
    if (!data) {return;}
    setSaving(true);
    try {
      await adminApi.updateSettingsGlobal(data);
      toast.success(t("settingsUpdated"));
    } catch {
      toast.error(
        t("saveError")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={2} />;
  }

  if (!data) {return null;}

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">{t("settingsGlobal")}</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {t("googleAnalyticsId")}
          </label>
          <Input
            type="text"
            value={data.google_analytics_id}
            onChange={(e) => setData({ ...data, google_analytics_id: e.target.value })}
            className="bg-slate-800 text-white"
            placeholder={t("gaPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">{t("stripeMode")}</label>
          <Select
            value={data.stripe_mode}
            onValueChange={(value: "test" | "live") =>
              setData({ ...data, stripe_mode: value })
            }
          >
            <SelectTrigger className="bg-slate-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test">{t("stripeTest")}</SelectItem>
              <SelectItem value="live">{t("stripeLive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <label className="text-sm font-medium text-slate-300">
              {t("maintenanceMode")}
            </label>
            <p className="text-xs text-slate-500">{t("maintenanceMode")}</p>
          </div>
          <Switch
            checked={data.maintenance_mode}
            onCheckedChange={(checked) => setData({ ...data, maintenance_mode: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <label className="text-sm font-medium text-slate-300">
              {t("registrationEnabled")}
            </label>
            <p className="text-xs text-slate-500">{t("registrationEnabled")}</p>
          </div>
          <Switch
            checked={data.registration_enabled}
            onCheckedChange={(checked) => setData({ ...data, registration_enabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <label className="text-sm font-medium text-slate-300">
              {t("emailNotifications")}
            </label>
            <p className="text-xs text-slate-500">{t("emailNotifications")}</p>
          </div>
          <Switch
            checked={data.email_notifications}
            onCheckedChange={(checked) => setData({ ...data, email_notifications: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <label className="text-sm font-medium text-slate-300">
              {t("smsNotifications")}
            </label>
            <p className="text-xs text-slate-500">{t("smsNotifications")}</p>
          </div>
          <Switch
            checked={data.sms_notifications}
            onCheckedChange={(checked) => setData({ ...data, sms_notifications: checked })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? t("loading") : t("save")}
        </Button>
      </div>
    </div>
  );
}
