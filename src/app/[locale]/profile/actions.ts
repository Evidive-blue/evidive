"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for profile update
const profileUpdateSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  certificationLevel: z.string().optional(),
  certificationOrg: z.string().optional(),
  totalDives: z.number().min(0).optional(),
});

export type ProfileData = z.infer<typeof profileUpdateSchema>;

interface ActionResult {
  success: boolean;
  error?: string;
  data?: ProfileData;
}

/**
 * Get current user's profile data
 */
export async function getProfile(): Promise<ActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        bio: true,
        certificationLevel: true,
        certificationOrg: true,
        totalDives: true,
      },
    });

    if (!profile) {
      return { success: false, error: "PROFILE_NOT_FOUND" };
    }

    return {
      success: true,
      data: {
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        country: profile.country || "",
        bio: profile.bio || "",
        certificationLevel: profile.certificationLevel || "none",
        certificationOrg: profile.certificationOrg || "padi",
        totalDives: profile.totalDives || 0,
      },
    };
  } catch (error) {
    console.error("[getProfile] Error:", error);
    return { success: false, error: "INTERNAL_ERROR" };
  }
}

/**
 * Update current user's profile
 */
export async function updateProfile(data: ProfileData): Promise<ActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }

    // Validate input
    const validationResult = profileUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: "VALIDATION_ERROR" };
    }

    const validData = validationResult.data;

    // Update profile in database
    await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        firstName: validData.firstName || null,
        lastName: validData.lastName || null,
        phone: validData.phone || null,
        address: validData.address || null,
        city: validData.city || null,
        country: validData.country || null,
        bio: validData.bio || null,
        certificationLevel: validData.certificationLevel || null,
        certificationOrg: validData.certificationOrg || null,
        totalDives: validData.totalDives ?? 0,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    return { success: false, error: "INTERNAL_ERROR" };
  }
}
