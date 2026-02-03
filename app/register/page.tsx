import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth";
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
    title: requireString(messages, "metadata.register.title"),
    description: requireString(messages, "metadata.register.description"),
  };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
