import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getLocale } from "@/lib/i18n/get-locale-server";
import { getMessages, getNestedValue } from "@/lib/i18n/get-messages";
import { ProfileClient } from "./profile-client";

function requireString(messages: Record<string, unknown>, path: string): string {
  const value = getNestedValue(messages, path);
  if (typeof value !== "string" || value.trim() === "") {
    return path.split(".").pop() || path;
  }
  return value;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  return {
    title: requireString(messages, "profile.title") + " | EviDive",
    description: requireString(messages, "profile.description"),
  };
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.diver.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      phone: true,
      address: true,
      city: true,
      zip: true,
      country: true,
      role: true,
      certificationLevel: true,
      certificationOrg: true,
      totalDives: true,
      preferredLanguage: true,
      emailNotifications: true,
      smsNotifications: true,
      timezone: true,
      emailVerified: true,
      emailVerifiedAt: true,
      createdAt: true,
      _count: {
        select: {
          centers: true,
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Serialize for client
  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null,
  };

  return <ProfileClient initialProfile={serializedUser} />;
}
