"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { User, Phone, Globe, Loader2 } from "lucide-react";
import { profileApi, isAdmin, isCenterOwner, setCachedAuthState } from "@/lib/api";

const LOCALES = ["fr", "en", "de", "es", "it", "pt", "nl"] as const;

export function OnboardProfileClient(): React.JSX.Element {
  const t = useTranslations("onboard");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLocale, setPreferredLocale] = useState("fr");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill from existing profile
  useEffect(() => {
    let cancelled = false;
    profileApi.getMe().then((profile) => {
      if (cancelled) { return; }
      if (profile.first_name) { setFirstName(profile.first_name); }
      if (profile.last_name) { setLastName(profile.last_name); }
      if (profile.display_name) { setDisplayName(profile.display_name); }
      if (profile.phone) { setPhone(profile.phone); }
      if (profile.preferred_locale) { setPreferredLocale(profile.preferred_locale); }
    }).catch(() => {
      // Profile fetch failed — user might not be authenticated
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-suggest display name on name change
  function handleFirstNameChange(value: string): void {
    setFirstName(value);
    const suggested = [value, lastName].filter(Boolean).join(" ");
    setDisplayName(suggested);
  }

  function handleLastNameChange(value: string): void {
    setLastName(value);
    const suggested = [firstName, value].filter(Boolean).join(" ");
    setDisplayName(suggested);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    try {
      const updated = await profileApi.updateMe({
        first_name: firstName,
        last_name: lastName,
        display_name: displayName || undefined,
        phone: phone || undefined,
        preferred_locale: preferredLocale,
      });

      // Update cached auth state
      const profileComplete = !!(updated.first_name && updated.last_name);
      let centerCount = 0;
      try {
        const centers = await profileApi.getMyCenters();
        centerCount = centers.length;
      } catch {
        // No centers yet
      }
      setCachedAuthState(updated.role, profileComplete, centerCount);

      // Redirect based on role
      if (isAdmin() && !isCenterOwner()) {
        router.push("/onboard/center");
      } else {
        router.push("/");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("error"));
      setStatus("error");
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400"
          role="alert"
        >
          {errorMsg}
        </motion.div>
      )}

      {/* First name / Last name */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="onboard-firstName" className="block text-sm font-medium text-slate-300">
            {t("firstName")}
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              id="onboard-firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              disabled={status === "loading"}
              autoComplete="given-name"
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="onboard-lastName" className="block text-sm font-medium text-slate-300">
            {t("lastName")}
          </label>
          <input
            id="onboard-lastName"
            type="text"
            required
              value={lastName}
              onChange={(e) => handleLastNameChange(e.target.value)}
            disabled={status === "loading"}
            autoComplete="family-name"
            className="input-ocean h-11 w-full px-4 text-sm"
          />
        </div>
      </div>

      {/* Display name */}
      <div className="space-y-2">
        <label htmlFor="onboard-displayName" className="block text-sm font-medium text-slate-300">
          {t("displayName")}
        </label>
        <input
          id="onboard-displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={status === "loading"}
          className="input-ocean h-11 w-full px-4 text-sm"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label htmlFor="onboard-phone" className="block text-sm font-medium text-slate-300">
          {t("phone")}
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            id="onboard-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={status === "loading"}
            autoComplete="tel"
            className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
          />
        </div>
      </div>

      {/* Preferred locale */}
      <div className="space-y-2">
        <label htmlFor="onboard-locale" className="block text-sm font-medium text-slate-300">
          {t("preferredLocale")}
        </label>
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <select
            id="onboard-locale"
            value={preferredLocale}
            onChange={(e) => setPreferredLocale(e.target.value)}
            disabled={status === "loading"}
            className="input-ocean h-11 w-full appearance-none pl-10 pr-4 text-sm"
          >
            {LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {t(`locale_${loc}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-ocean flex h-11 w-full items-center justify-center gap-2 px-6 text-sm"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {tCommon("loading")}
          </>
        ) : (
          t("continue")
        )}
      </button>
    </motion.form>
  );
}
