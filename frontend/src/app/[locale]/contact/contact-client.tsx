"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { getApiUrl } from "@/lib/site-config";

export function ContactClient() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const subject = (form.elements.namedItem("subject") as HTMLInputElement)
      .value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)
      .value;

    try {
      const apiBase = `${getApiUrl().replace(/\/$/, "")}/api/v1`;
      const res = await fetch(`${apiBase}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            {t("name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="input-ocean w-full px-4 py-3 text-sm"
            placeholder={t("name")}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="input-ocean w-full px-4 py-3 text-sm"
            placeholder={t("email")}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="subject"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          {t("subject")}
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          className="input-ocean w-full px-4 py-3 text-sm"
          placeholder={t("subject")}
        />
      </div>
      <div>
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="input-ocean w-full px-4 py-3 text-sm"
          placeholder={t("message")}
        />
      </div>
      {status === "success" && (
        <p className="rounded-lg bg-emerald-500/20 px-4 py-3 text-emerald-400">
          {t("success")}
        </p>
      )}
      {status === "error" && (
        <p className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
          {t("error")}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-ocean w-full px-6 py-3 text-sm sm:w-auto"
      >
        {status === "sending" ? t("sending") : t("send")}
      </button>
    </motion.form>
  );
}
