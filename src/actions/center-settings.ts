"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CancellationPolicy } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface CenterSettingsResult {
  ok: boolean;
  error?: string;
}

export interface CenterSettingsData {
  // Notifications
  emailOnNewBooking: boolean;
  emailOnCancellation: boolean;
  emailOnNewReview: boolean;
  smsOnNewBooking: boolean;
  dailyBookingReminder: boolean;
  // Cancellation policy
  cancellationPolicy: CancellationPolicy;
  cancellationHours: number;
  partialRefundPercent: number;
  // Payment
  stripeAccountId: string | null;
  iban: string | null;
  // Info
  commissionRate: number;
  phone: string | null;
  status: string;
}

// ============================================
// Get Center Settings
// ============================================

export async function getCenterSettings(
  centerId: string
): Promise<CenterSettingsData | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    // Verify ownership
    const center = await prisma.diveCenter.findFirst({
      where: {
        id: centerId,
        ownerId: session.user.id,
      },
      select: {
        emailOnNewBooking: true,
        emailOnCancellation: true,
        emailOnNewReview: true,
        smsOnNewBooking: true,
        dailyBookingReminder: true,
        cancellationPolicy: true,
        cancellationHours: true,
        partialRefundPercent: true,
        stripeAccountId: true,
        iban: true,
        commissionRate: true,
        phone: true,
        status: true,
      },
    });

    if (!center) return null;

    return {
      ...center,
      commissionRate: Number(center.commissionRate),
    };
  } catch (error) {
    console.error("[GET_CENTER_SETTINGS_ERROR]", error);
    return null;
  }
}

// ============================================
// Update Notification Settings
// ============================================

export async function updateCenterNotifications(
  centerId: string,
  data: {
    emailOnNewBooking?: boolean;
    emailOnCancellation?: boolean;
    emailOnNewReview?: boolean;
    smsOnNewBooking?: boolean;
    dailyBookingReminder?: boolean;
  }
): Promise<CenterSettingsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Verify ownership
    const center = await prisma.diveCenter.findFirst({
      where: {
        id: centerId,
        ownerId: session.user.id,
      },
      select: { id: true },
    });

    if (!center) {
      return { ok: false, error: "not_found" };
    }

    await prisma.diveCenter.update({
      where: { id: centerId },
      data: {
        ...(data.emailOnNewBooking !== undefined && {
          emailOnNewBooking: data.emailOnNewBooking,
        }),
        ...(data.emailOnCancellation !== undefined && {
          emailOnCancellation: data.emailOnCancellation,
        }),
        ...(data.emailOnNewReview !== undefined && {
          emailOnNewReview: data.emailOnNewReview,
        }),
        ...(data.smsOnNewBooking !== undefined && {
          smsOnNewBooking: data.smsOnNewBooking,
        }),
        ...(data.dailyBookingReminder !== undefined && {
          dailyBookingReminder: data.dailyBookingReminder,
        }),
      },
    });

    revalidatePath("/center/settings");
    return { ok: true };
  } catch (error) {
    console.error("[UPDATE_CENTER_NOTIFICATIONS_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Update Cancellation Policy
// ============================================

export async function updateCancellationPolicy(
  centerId: string,
  data: {
    cancellationPolicy: CancellationPolicy;
    cancellationHours: number;
    partialRefundPercent: number;
  }
): Promise<CenterSettingsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Verify ownership
    const center = await prisma.diveCenter.findFirst({
      where: {
        id: centerId,
        ownerId: session.user.id,
      },
      select: { id: true },
    });

    if (!center) {
      return { ok: false, error: "not_found" };
    }

    // Validate data
    if (data.cancellationHours < 0 || data.cancellationHours > 168) {
      return { ok: false, error: "invalid_hours" };
    }

    if (data.partialRefundPercent < 0 || data.partialRefundPercent > 100) {
      return { ok: false, error: "invalid_refund_percent" };
    }

    const validPolicies: CancellationPolicy[] = [
      "FLEXIBLE",
      "MODERATE",
      "STRICT",
    ];
    if (!validPolicies.includes(data.cancellationPolicy)) {
      return { ok: false, error: "invalid_policy" };
    }

    await prisma.diveCenter.update({
      where: { id: centerId },
      data: {
        cancellationPolicy: data.cancellationPolicy,
        cancellationHours: data.cancellationHours,
        partialRefundPercent: data.partialRefundPercent,
      },
    });

    revalidatePath("/center/settings");
    return { ok: true };
  } catch (error) {
    console.error("[UPDATE_CANCELLATION_POLICY_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Update IBAN
// ============================================

export async function updateCenterIban(
  centerId: string,
  iban: string | null
): Promise<CenterSettingsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Verify ownership
    const center = await prisma.diveCenter.findFirst({
      where: {
        id: centerId,
        ownerId: session.user.id,
      },
      select: { id: true },
    });

    if (!center) {
      return { ok: false, error: "not_found" };
    }

    // Basic IBAN validation (if provided)
    if (iban) {
      const cleanIban = iban.replace(/\s/g, "").toUpperCase();
      if (cleanIban.length < 15 || cleanIban.length > 34) {
        return { ok: false, error: "invalid_iban" };
      }
    }

    await prisma.diveCenter.update({
      where: { id: centerId },
      data: { iban: iban?.replace(/\s/g, "").toUpperCase() || null },
    });

    revalidatePath("/center/settings");
    return { ok: true };
  } catch (error) {
    console.error("[UPDATE_CENTER_IBAN_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Deactivate Center (Suspend)
// ============================================

export async function deactivateCenter(
  centerId: string
): Promise<CenterSettingsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Verify ownership
    const center = await prisma.diveCenter.findFirst({
      where: {
        id: centerId,
        ownerId: session.user.id,
      },
      select: { id: true, status: true },
    });

    if (!center) {
      return { ok: false, error: "not_found" };
    }

    // Already suspended
    if (center.status === "SUSPENDED") {
      return { ok: false, error: "already_suspended" };
    }

    await prisma.diveCenter.update({
      where: { id: centerId },
      data: { status: "SUSPENDED" },
    });

    revalidatePath("/center/settings");
    revalidatePath("/center");
    return { ok: true };
  } catch (error) {
    console.error("[DEACTIVATE_CENTER_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Reactivate Center
// ============================================

export async function reactivateCenter(
  centerId: string
): Promise<CenterSettingsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Verify ownership
    const center = await prisma.diveCenter.findFirst({
      where: {
        id: centerId,
        ownerId: session.user.id,
      },
      select: { id: true, status: true },
    });

    if (!center) {
      return { ok: false, error: "not_found" };
    }

    // Not suspended
    if (center.status !== "SUSPENDED") {
      return { ok: false, error: "not_suspended" };
    }

    await prisma.diveCenter.update({
      where: { id: centerId },
      data: { status: "APPROVED" },
    });

    revalidatePath("/center/settings");
    revalidatePath("/center");
    return { ok: true };
  } catch (error) {
    console.error("[REACTIVATE_CENTER_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Delete Center (Permanent)
// ============================================

export async function deleteCenter(
  centerId: string,
  confirmationText: string
): Promise<CenterSettingsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Verify ownership
    const center = await prisma.diveCenter.findFirst({
      where: {
        id: centerId,
        ownerId: session.user.id,
      },
      select: { id: true, slug: true },
    });

    if (!center) {
      return { ok: false, error: "not_found" };
    }

    // Verify confirmation text matches slug
    if (confirmationText !== center.slug) {
      return { ok: false, error: "confirmation_mismatch" };
    }

    // Check for pending/active bookings
    const activeBookingsCount = await prisma.booking.count({
      where: {
        centerId: centerId,
        status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
        diveDate: { gte: new Date() },
      },
    });

    if (activeBookingsCount > 0) {
      return { ok: false, error: "has_active_bookings" };
    }

    // Delete center (cascades to services, workers, etc. per schema)
    await prisma.diveCenter.delete({
      where: { id: centerId },
    });

    revalidatePath("/center");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("[DELETE_CENTER_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Get Stripe Onboarding Link
// ============================================

export async function getStripeOnboardingLink(
  centerId: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Verify ownership
    const center = await prisma.diveCenter.findFirst({
      where: {
        id: centerId,
        ownerId: session.user.id,
      },
      select: { id: true, stripeAccountId: true, email: true },
    });

    if (!center) {
      return { ok: false, error: "not_found" };
    }

    // If Stripe is not configured in env, return placeholder
    if (!process.env.STRIPE_SECRET_KEY) {
      return { ok: false, error: "stripe_not_configured" };
    }

    // This is a placeholder - actual Stripe Connect implementation
    // would create an account link here
    // For now, return a message that Stripe Connect is coming soon
    return { ok: false, error: "stripe_coming_soon" };
  } catch (error) {
    console.error("[GET_STRIPE_ONBOARDING_LINK_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}
