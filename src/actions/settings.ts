"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Locale } from "@/i18n/config";

// ============================================
// Types
// ============================================

export interface SettingsUpdateResult {
  ok: boolean;
  error?: string;
}

export interface UserDataExport {
  profile: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    bio: string | null;
    certificationLevel: string | null;
    certificationOrg: string | null;
    totalDives: number;
    preferredLanguage: string;
    createdAt: string;
  };
  bookings: Array<{
    reference: string;
    diveDate: string;
    status: string;
    totalPrice: string;
    centerName: string;
    serviceName: string;
  }>;
  reviews: Array<{
    rating: number;
    comment: string;
    createdAt: string;
    centerName: string;
  }>;
  exportedAt: string;
}

// ============================================
// Notification Settings
// ============================================

export async function updateNotificationSettings(data: {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}): Promise<SettingsUpdateResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        ...(data.emailNotifications !== undefined && {
          emailNotifications: data.emailNotifications,
        }),
        ...(data.smsNotifications !== undefined && {
          smsNotifications: data.smsNotifications,
        }),
      },
    });

    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    console.error("[UPDATE_NOTIFICATION_SETTINGS_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Privacy Settings
// ============================================

export async function updatePrivacySettings(data: {
  profileVisibleToCenters?: boolean;
}): Promise<SettingsUpdateResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        ...(data.profileVisibleToCenters !== undefined && {
          profileVisibleToCenters: data.profileVisibleToCenters,
        }),
      },
    });

    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    console.error("[UPDATE_PRIVACY_SETTINGS_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Language Preference
// ============================================

export async function updateLanguagePreference(
  language: Locale
): Promise<SettingsUpdateResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Validate language is one of the supported locales
    const supportedLocales = ["fr", "en", "es", "it"];
    if (!supportedLocales.includes(language)) {
      return { ok: false, error: "invalid_language" };
    }

    await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        preferredLanguage: language,
      },
    });

    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    console.error("[UPDATE_LANGUAGE_PREFERENCE_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Export User Data (GDPR)
// ============================================

export async function exportUserData(): Promise<{
  ok: boolean;
  data?: UserDataExport;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Fetch all user data
    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        phone: true,
        city: true,
        country: true,
        bio: true,
        certificationLevel: true,
        certificationOrg: true,
        totalDives: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return { ok: false, error: "user_not_found" };
    }

    // Fetch user bookings with relations
    const bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        center: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch user reviews with relations
    const reviews = await prisma.review.findMany({
      where: { userId: session.user.id },
      include: {
        center: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Helper to extract localized name
    const getLocalizedName = (
      nameJson: unknown,
      locale: string = "fr"
    ): string => {
      if (typeof nameJson === "object" && nameJson !== null) {
        const nameObj = nameJson as Record<string, string>;
        return nameObj[locale] || nameObj["fr"] || nameObj["en"] || "N/A";
      }
      return String(nameJson || "N/A");
    };

    // Type assertion needed due to Prisma Accelerate extension type inference issues
    const bookingsWithRelations = bookings as Array<
      (typeof bookings)[number] & {
        center: { name: unknown };
        service: { name: unknown };
      }
    >;
    const reviewsWithRelations = reviews as Array<
      (typeof reviews)[number] & {
        center: { name: unknown };
      }
    >;

    const exportData: UserDataExport = {
      profile: {
        ...profile,
        createdAt: profile.createdAt.toISOString(),
      },
      bookings: bookingsWithRelations.map((b) => ({
        reference: b.reference,
        diveDate: b.diveDate.toISOString(),
        status: b.status,
        totalPrice: b.totalPrice.toString(),
        centerName: getLocalizedName(b.center.name),
        serviceName: getLocalizedName(b.service.name),
      })),
      reviews: reviewsWithRelations.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        centerName: getLocalizedName(r.center.name),
      })),
      exportedAt: new Date().toISOString(),
    };

    return { ok: true, data: exportData };
  } catch (error) {
    console.error("[EXPORT_USER_DATA_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Delete Account (Soft Delete)
// ============================================

export async function deleteAccount(): Promise<SettingsUpdateResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Soft delete: set isActive to false
    await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        isActive: false,
        // Anonymize personal data for GDPR compliance
        firstName: null,
        lastName: null,
        displayName: "Compte supprimé",
        phone: null,
        bio: null,
        avatarUrl: null,
        bannerUrl: null,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[DELETE_ACCOUNT_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Get User Settings
// ============================================

export async function getUserSettings() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotifications: true,
        smsNotifications: true,
        profileVisibleToCenters: true,
        preferredLanguage: true,
        phone: true,
        emailVerified: true,
        email: true,
      },
    });

    return profile;
  } catch (error) {
    console.error("[GET_USER_SETTINGS_ERROR]", error);
    return null;
  }
}
