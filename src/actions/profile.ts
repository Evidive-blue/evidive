"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================
// Validation Schema
// ============================================

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  certificationLevel: z.string().max(50).optional().nullable(),
  certificationOrg: z.string().max(50).optional().nullable(),
  totalDives: z.number().int().min(0).max(99999).optional(),
});

// ============================================
// Update Profile Action
// ============================================

export interface UpdateProfileResult {
  ok: boolean;
  error?: string;
  profile?: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    bio: string | null;
    certificationLevel: string | null;
    certificationOrg: string | null;
    totalDives: number;
  };
}

export async function updateProfile(
  data: z.infer<typeof updateProfileSchema>
): Promise<UpdateProfileResult> {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "unauthorized" };
    }

    // Valider les données
    const validated = updateProfileSchema.safeParse(data);
    if (!validated.success) {
      return { ok: false, error: "validation_error" };
    }

    // Mettre à jour le profil
    const updatedProfile = await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        ...validated.data,
      },
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

    // Revalider les chemins
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/app");

    return {
      ok: true,
      profile: updatedProfile,
    };
  } catch (error) {
    console.error("[UPDATE_PROFILE_ERROR]", error);
    return { ok: false, error: "server_error" };
  }
}

// ============================================
// Get Profile Data
// ============================================

export async function getProfileData() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        displayName: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        bio: true,
        certificationLevel: true,
        certificationOrg: true,
        totalDives: true,
        avatarUrl: true,
      },
    });

    return profile;
  } catch (error) {
    console.error("[GET_PROFILE_DATA_ERROR]", error);
    return null;
  }
}
