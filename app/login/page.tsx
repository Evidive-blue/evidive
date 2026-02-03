import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth";
import { getLocale } from "@/lib/i18n/get-locale-server";
import { getMessages, getNestedValue } from "@/lib/i18n/get-messages";

function requireString(messages: Record<string, unknown>, path: string): string {
  const value = getNestedValue(messages, path);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing i18n string: ${path}`);
  }
  return value;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  return {
    title: requireString(messages, "metadata.login.title"),
    description: requireString(messages, "metadata.login.description"),
  };
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
    </div>}>
      <LoginForm />
    </Suspense>
  );
}
