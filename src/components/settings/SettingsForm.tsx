"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Bell,
  Shield,
  Globe,
  Lock,
  LogOut,
  Trash2,
  User,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationToggles } from "./NotificationToggles";
import { PrivacyToggles } from "./PrivacyToggles";
import { LanguageSelector } from "./LanguageSelector";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { ExportDataButton } from "./ExportDataButton";

interface SettingsFormProps {
  locale: string;
  settings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    profileVisibleToCenters: boolean;
    preferredLanguage: string;
    phone: string | null;
    emailVerified: boolean;
    email: string;
  };
}

export function SettingsForm({ locale, settings }: SettingsFormProps) {
  const t = useTranslations("settings");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSuccess = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error("Settings error:", error);
    // Could show an error toast here
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: `/${locale}/login` });
  };

  return (
    <>
      {/* Toast notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
        >
          <CheckCircle className="h-4 w-4" />
          {t("saved")}
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="h-5 w-5 text-cyan-400" />
                {t("sections.notifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <NotificationToggles
                initialEmailNotifications={settings.emailNotifications}
                initialSmsNotifications={settings.smsNotifications}
                hasPhone={!!settings.phone}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-cyan-400" />
                {t("sections.privacy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <PrivacyToggles
                initialProfileVisible={settings.profileVisibleToCenters}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Language & Region */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5 text-cyan-400" />
                {t("sections.language")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <LanguageSelector
                currentLocale={locale}
                preferredLanguage={settings.preferredLanguage}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-5 w-5 text-cyan-400" />
                {t("sections.security")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Link href="/forgot-password">
                  <button
                    className="flex w-full items-center justify-between rounded-xl border border-white/20 p-4 text-left transition-all hover:border-white/40 hover:bg-white/5"
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <Lock className="h-5 w-5 text-white/70" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {t("security.changePassword.label")}
                        </p>
                        <p className="text-xs text-white/60">
                          {t("security.changePassword.description")}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40" />
                  </button>
                </Link>

                <div className="rounded-xl border border-white/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Shield className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {t("security.emailVerified.label")}
                      </p>
                      <p className="text-xs text-white/60">{settings.email}</p>
                    </div>
                    {settings.emailVerified && (
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                        {t("security.verified")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-cyan-400" />
                {t("sections.account")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Export Data (GDPR) */}
                <ExportDataButton onError={handleError} />

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-between rounded-xl border border-white/20 p-4 text-left transition-all hover:border-amber-500/50 hover:bg-amber-500/5"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                      <LogOut className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-400">
                        {t("account.signOut.label")}
                      </p>
                      <p className="text-xs text-white/60">
                        {t("account.signOut.description")}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Delete Account */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex w-full items-center justify-between rounded-xl border border-red-500/30 p-4 text-left transition-all hover:border-red-500/50 hover:bg-red-500/5"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-400">
                        {t("account.delete.label")}
                      </p>
                      <p className="text-xs text-white/60">
                        {t("account.delete.description")}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        locale={locale}
      />
    </>
  );
}
