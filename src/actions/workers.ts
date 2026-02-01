"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const createWorkerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  bio: z.string().optional(),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

const updateWorkerSchema = createWorkerSchema.extend({
  id: z.string(),
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;

/**
 * Verifies that the current user owns the specified center.
 * Returns the center if authorized, null otherwise.
 */
async function getAuthorizedCenter(centerId?: string) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // Only CENTER_OWNER and ADMIN can manage workers
  if (
    session.user.userType !== "CENTER_OWNER" &&
    session.user.userType !== "ADMIN"
  ) {
    return null;
  }

  // If no centerId specified, find the user's center
  if (!centerId) {
    const center = await prisma.diveCenter.findFirst({
      where: {
        ownerId: session.user.id,
        status: "APPROVED",
      },
      select: { id: true, ownerId: true },
    });
    return center;
  }

  // Verify the user owns this center
  const center = await prisma.diveCenter.findUnique({
    where: { id: centerId },
    select: { id: true, ownerId: true },
  });

  if (!center) {
    return null;
  }

  // ADMIN can manage any center
  if (session.user.userType === "ADMIN") {
    return center;
  }

  // CENTER_OWNER can only manage their own center
  if (center.ownerId !== session.user.id) {
    return null;
  }

  return center;
}

/**
 * Create a new worker for a dive center
 */
export async function createWorker(
  input: CreateWorkerInput
): Promise<{ success: boolean; error?: string; workerId?: string }> {
  try {
    const center = await getAuthorizedCenter();

    if (!center) {
      return {
        success: false,
        error: "Non autorisé ou centre non trouvé",
      };
    }

    const parsed = createWorkerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Données invalides",
      };
    }

    const { name, email, phone, photoUrl, bio, certifications, languages } =
      parsed.data;

    const worker = await prisma.centerWorker.create({
      data: {
        centerId: center.id,
        name,
        email: email || null,
        phone: phone || null,
        photoUrl: photoUrl || null,
        bio: bio || null,
        certifications,
        languages,
        isDefault: false,
        isActive: true,
      },
    });

    revalidatePath("/center/team");

    return { success: true, workerId: worker.id };
  } catch (error) {
    console.error("Error creating worker:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la création",
    };
  }
}

/**
 * Update an existing worker
 */
export async function updateWorker(
  input: UpdateWorkerInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const center = await getAuthorizedCenter();

    if (!center) {
      return {
        success: false,
        error: "Non autorisé ou centre non trouvé",
      };
    }

    const parsed = updateWorkerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Données invalides",
      };
    }

    const { id, name, email, phone, photoUrl, bio, certifications, languages } =
      parsed.data;

    // Verify the worker belongs to this center
    const existingWorker = await prisma.centerWorker.findUnique({
      where: { id },
      select: { centerId: true },
    });

    if (!existingWorker || existingWorker.centerId !== center.id) {
      return {
        success: false,
        error: "Membre d'équipe non trouvé",
      };
    }

    await prisma.centerWorker.update({
      where: { id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        photoUrl: photoUrl || null,
        bio: bio || null,
        certifications,
        languages,
      },
    });

    revalidatePath("/center/team");

    return { success: true };
  } catch (error) {
    console.error("Error updating worker:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour",
    };
  }
}

/**
 * Deactivate a worker (soft disable)
 */
export async function deactivateWorker(
  workerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const center = await getAuthorizedCenter();

    if (!center) {
      return {
        success: false,
        error: "Non autorisé ou centre non trouvé",
      };
    }

    // Verify the worker belongs to this center
    const worker = await prisma.centerWorker.findUnique({
      where: { id: workerId },
      select: { centerId: true, isDefault: true },
    });

    if (!worker || worker.centerId !== center.id) {
      return {
        success: false,
        error: "Membre d'équipe non trouvé",
      };
    }

    // Cannot deactivate the owner (isDefault)
    if (worker.isDefault) {
      return {
        success: false,
        error: "Le propriétaire ne peut pas être désactivé",
      };
    }

    await prisma.centerWorker.update({
      where: { id: workerId },
      data: { isActive: false },
    });

    revalidatePath("/center/team");

    return { success: true };
  } catch (error) {
    console.error("Error deactivating worker:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la désactivation",
    };
  }
}

/**
 * Reactivate a worker
 */
export async function reactivateWorker(
  workerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const center = await getAuthorizedCenter();

    if (!center) {
      return {
        success: false,
        error: "Non autorisé ou centre non trouvé",
      };
    }

    // Verify the worker belongs to this center
    const worker = await prisma.centerWorker.findUnique({
      where: { id: workerId },
      select: { centerId: true },
    });

    if (!worker || worker.centerId !== center.id) {
      return {
        success: false,
        error: "Membre d'équipe non trouvé",
      };
    }

    await prisma.centerWorker.update({
      where: { id: workerId },
      data: { isActive: true },
    });

    revalidatePath("/center/team");

    return { success: true };
  } catch (error) {
    console.error("Error reactivating worker:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la réactivation",
    };
  }
}

/**
 * Delete a worker permanently
 * Only allowed if:
 * - Worker is not the owner (isDefault !== true)
 * - Worker has no associated bookings
 */
export async function deleteWorker(
  workerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const center = await getAuthorizedCenter();

    if (!center) {
      return {
        success: false,
        error: "Non autorisé ou centre non trouvé",
      };
    }

    // Verify the worker belongs to this center and check constraints
    const worker = await prisma.centerWorker.findUnique({
      where: { id: workerId },
      select: {
        centerId: true,
        isDefault: true,
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!worker || worker.centerId !== center.id) {
      return {
        success: false,
        error: "Membre d'équipe non trouvé",
      };
    }

    // Cannot delete the owner (isDefault)
    if (worker.isDefault) {
      return {
        success: false,
        error: "Le propriétaire ne peut pas être supprimé",
      };
    }

    // Cannot delete if worker has bookings
    if (worker._count.bookings > 0) {
      return {
        success: false,
        error: `Ce membre a ${worker._count.bookings} réservation(s) associée(s). Vous pouvez uniquement le désactiver.`,
      };
    }

    await prisma.centerWorker.delete({
      where: { id: workerId },
    });

    revalidatePath("/center/team");

    return { success: true };
  } catch (error) {
    console.error("Error deleting worker:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la suppression",
    };
  }
}
