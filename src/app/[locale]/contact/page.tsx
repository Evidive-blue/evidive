"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
        setError(typeof data?.error === "string" ? data.error : "Erreur lors de l’envoi.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Erreur lors de l’envoi.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-16 pt-24">
      {/* Background glow */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="mb-4 text-5xl font-bold text-white md:text-6xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-slate-400">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {isSuccess ? (
              <div className="rounded-3xl border border-cyan-500/30 bg-white/5 p-8 text-center backdrop-blur-xl">
                <motion.div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <CheckCircle className="h-8 w-8 text-cyan-400" />
                </motion.div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  {t("success")}
                </h3>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <LiquidInput
                  label={t("name")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <LiquidInput
                  type="email"
                  label={t("email")}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <LiquidInput
                  label={t("subject")}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />

                <div className="relative">
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t("message")}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 backdrop-blur-xl transition-all focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <MagneticButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-5 w-5" />
                  )}
                  {t("send")}
                </MagneticButton>

                {error ? (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                ) : null}
              </form>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-semibold text-white">
                {t("info_title")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="text-slate-300">{t("info_email")}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="text-slate-300">{t("info_address")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
