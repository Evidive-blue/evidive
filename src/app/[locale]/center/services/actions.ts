"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  duplicateServiceSchema,
  createExtraSchema,
  updateExtraSchema,
  deleteExtraSchema,
  type ServiceExtraData,
} from "@/lib/validations/service";
import type { Prisma } from "@prisma/client";

type ActionResult = {
  success: boolean;
  error?: string;
  serviceId?: string;
  extraId?: string;
};

type LocalizedJson = {
  fr?: string;
  en?: string;
  es?: string;
  it?: string;
  de?: string;
};

/**
 * Helper to verify user owns the center
 */
async function verifyCenterOwnership(
  userId: string
): Promise<{ id: string } | null> {
  const center = await prisma.diveCenter.findFirst({
    where: {
      ownerId: userId,
      status: "APPROVED",
    },
    select: { id: true },
  });

  return center;
}

/**
 * Helper to verify service belongs to user's center
 */
async function verifyServiceOwnership(
  serviceId: string,
  centerId: string
): Promise<boolean> {
  const service = await prisma.diveService.findFirst({
    where: {
      id: serviceId,
      centerId: centerId,
    },
  });

  return !!service;
}

/**
 * Create a new dive service
 */
export async function createService(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user owns an approved center
    const center = await verifyCenterOwnership(session.user.id);
    if (!center) {
      return { success: false, error: "No approved center found" };
    }

    // Parse form data
    const rawData = {
      name: JSON.parse(formData.get("name") as string),
      description: formData.get("description")
        ? JSON.parse(formData.get("description") as string)
        : undefined,
      categoryId: formData.get("categoryId") || null,
      price: parseFloat(formData.get("price") as string),
      currency: (formData.get("currency") as string) || "EUR",
      pricePerPerson: formData.get("pricePerPerson") === "true",
      durationMinutes: parseInt(formData.get("durationMinutes") as string, 10),
      minParticipants: parseInt(formData.get("minParticipants") as string, 10) || 1,
      maxParticipants: parseInt(formData.get("maxParticipants") as string, 10) || 10,
      minCertification: formData.get("minCertification") || null,
      minAge: parseInt(formData.get("minAge") as string, 10) || 10,
      maxDepth: formData.get("maxDepth")
        ? parseInt(formData.get("maxDepth") as string, 10)
        : null,
      equipmentIncluded: formData.get("equipmentIncluded") === "true",
      equipmentDetails: formData.get("equipmentDetails") || null,
      includes: formData.get("includes")
        ? JSON.parse(formData.get("includes") as string)
        : [],
      photos: formData.get("photos")
        ? JSON.parse(formData.get("photos") as string)
        : [],
      availableDays: formData.get("availableDays")
        ? JSON.parse(formData.get("availableDays") as string)
        : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      startTimes: formData.get("startTimes")
        ? JSON.parse(formData.get("startTimes") as string)
        : [],
      extras: formData.get("extras")
        ? JSON.parse(formData.get("extras") as string)
        : [],
    };

    // Validate
    const parsed = createServiceSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    const data = parsed.data;

    // Create service with extras in a transaction
    const service = await prisma.$transaction(async (tx) => {
      // Create the service
      const newService = await tx.diveService.create({
        data: {
          centerId: center.id,
          name: data.name as Prisma.InputJsonValue,
          description: data.description as Prisma.InputJsonValue | undefined,
          categoryId: data.categoryId || undefined,
          price: data.price,
          currency: data.currency,
          pricePerPerson: data.pricePerPerson,
          durationMinutes: data.durationMinutes,
          minParticipants: data.minParticipants,
          maxParticipants: data.maxParticipants,
          minCertification: data.minCertification || undefined,
          minAge: data.minAge,
          maxDepth: data.maxDepth,
          equipmentIncluded: data.equipmentIncluded,
          equipmentDetails: data.equipmentDetails,
          includes: data.includes,
          photos: data.photos,
          availableDays: data.availableDays,
          startTimes: data.startTimes,
          isActive: true,
        },
      });

      // Create extras if any
      if (data.extras && data.extras.length > 0) {
        await tx.serviceExtra.createMany({
          data: data.extras.map((extra: ServiceExtraData) => ({
            serviceId: newService.id,
            name: extra.name as Prisma.InputJsonValue,
            description: extra.description as Prisma.InputJsonValue | undefined,
            price: extra.price,
            multiplyByPax: extra.multiplyByPax,
            isRequired: extra.isRequired,
            isActive: extra.isActive,
          })),
        });
      }

      return newService;
    });

    revalidatePath("/center/services");

    return { success: true, serviceId: service.id };
  } catch (error) {
    console.error("Error creating service:", error);
    return { success: false, error: "Failed to create service" };
  }
}

/**
 * Update an existing dive service
 */
export async function updateService(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const center = await verifyCenterOwnership(session.user.id);
    if (!center) {
      return { success: false, error: "No approved center found" };
    }

    const serviceId = formData.get("id") as string;
    if (!serviceId) {
      return { success: false, error: "Service ID required" };
    }

    // Verify ownership
    const isOwner = await verifyServiceOwnership(serviceId, center.id);
    if (!isOwner) {
      return { success: false, error: "Service not found" };
    }

    // Parse form data
    const rawData = {
      id: serviceId,
      name: JSON.parse(formData.get("name") as string),
      description: formData.get("description")
        ? JSON.parse(formData.get("description") as string)
        : undefined,
      categoryId: formData.get("categoryId") || null,
      price: parseFloat(formData.get("price") as string),
      currency: (formData.get("currency") as string) || "EUR",
      pricePerPerson: formData.get("pricePerPerson") === "true",
      durationMinutes: parseInt(formData.get("durationMinutes") as string, 10),
      minParticipants: parseInt(formData.get("minParticipants") as string, 10) || 1,
      maxParticipants: parseInt(formData.get("maxParticipants") as string, 10) || 10,
      minCertification: formData.get("minCertification") || null,
      minAge: parseInt(formData.get("minAge") as string, 10) || 10,
      maxDepth: formData.get("maxDepth")
        ? parseInt(formData.get("maxDepth") as string, 10)
        : null,
      equipmentIncluded: formData.get("equipmentIncluded") === "true",
      equipmentDetails: formData.get("equipmentDetails") || null,
      includes: formData.get("includes")
        ? JSON.parse(formData.get("includes") as string)
        : [],
      photos: formData.get("photos")
        ? JSON.parse(formData.get("photos") as string)
        : [],
      availableDays: formData.get("availableDays")
        ? JSON.parse(formData.get("availableDays") as string)
        : [],
      startTimes: formData.get("startTimes")
        ? JSON.parse(formData.get("startTimes") as string)
        : [],
      extras: formData.get("extras")
        ? JSON.parse(formData.get("extras") as string)
        : [],
    };

    // Validate
    const parsed = updateServiceSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    const data = parsed.data;

    // Update service and extras in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the service
      await tx.diveService.update({
        where: { id: serviceId },
        data: {
          name: data.name as Prisma.InputJsonValue,
          description: data.description as Prisma.InputJsonValue | undefined,
          categoryId: data.categoryId || undefined,
          price: data.price,
          currency: data.currency,
          pricePerPerson: data.pricePerPerson,
          durationMinutes: data.durationMinutes,
          minParticipants: data.minParticipants,
          maxParticipants: data.maxParticipants,
          minCertification: data.minCertification || undefined,
          minAge: data.minAge,
          maxDepth: data.maxDepth,
          equipmentIncluded: data.equipmentIncluded,
          equipmentDetails: data.equipmentDetails,
          includes: data.includes,
          photos: data.photos,
          availableDays: data.availableDays,
          startTimes: data.startTimes,
        },
      });

      // Handle extras: delete existing and recreate
      await tx.serviceExtra.deleteMany({
        where: { serviceId: serviceId },
      });

      if (data.extras && data.extras.length > 0) {
        await tx.serviceExtra.createMany({
          data: data.extras.map((extra: ServiceExtraData) => ({
            serviceId: serviceId,
            name: extra.name as Prisma.InputJsonValue,
            description: extra.description as Prisma.InputJsonValue | undefined,
            price: extra.price,
            multiplyByPax: extra.multiplyByPax,
            isRequired: extra.isRequired,
            isActive: extra.isActive,
          })),
        });
      }
    });

    revalidatePath("/center/services");
    revalidatePath(`/center/services/${serviceId}/edit`);

    return { success: true, serviceId };
  } catch (error) {
    console.error("Error updating service:", error);
    return { success: false, error: "Failed to update service" };
  }
}

/**
 * Archive a service (soft delete by setting isActive = false)
 */
export async function archiveService(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const center = await verifyCenterOwnership(session.user.id);
    if (!center) {
      return { success: false, error: "No approved center found" };
    }

    const serviceId = formData.get("id") as string;

    const parsed = serviceIdSchema.safeParse({ id: serviceId });
    if (!parsed.success) {
      return { success: false, error: "Invalid service ID" };
    }

    // Verify ownership
    const isOwner = await verifyServiceOwnership(serviceId, center.id);
    if (!isOwner) {
      return { success: false, error: "Service not found" };
    }

    await prisma.diveService.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    revalidatePath("/center/services");

    return { success: true, serviceId };
  } catch (error) {
    console.error("Error archiving service:", error);
    return { success: false, error: "Failed to archive service" };
  }
}

/**
 * Activate a service (set isActive = true)
 */
export async function activateService(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const center = await verifyCenterOwnership(session.user.id);
    if (!center) {
      return { success: false, error: "No approved center found" };
    }

    const serviceId = formData.get("id") as string;

    const parsed = serviceIdSchema.safeParse({ id: serviceId });
    if (!parsed.success) {
      return { success: false, error: "Invalid service ID" };
    }

    // Verify ownership
    const isOwner = await verifyServiceOwnership(serviceId, center.id);
    if (!isOwner) {
      return { success: false, error: "Service not found" };
    }

    await prisma.diveService.update({
      where: { id: serviceId },
      data: { isActive: true },
    });

    revalidatePath("/center/services");

    return { success: true, serviceId };
  } catch (error) {
    console.error("Error activating service:", error);
    return { success: false, error: "Failed to activate service" };
  }
}

/**
 * Delete a service permanently
 */
export async function deleteService(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const center = await verifyCenterOwnership(session.user.id);
    if (!center) {
      return { success: false, error: "No approved center found" };
    }

    const serviceId = formData.get("id") as string;

    const parsed = serviceIdSchema.safeParse({ id: serviceId });
    if (!parsed.success) {
      return { success: false, error: "Invalid service ID" };
    }

    // Verify ownership
    const isOwner = await verifyServiceOwnership(serviceId, center.id);
    if (!isOwner) {
      return { success: false, error: "Service not found" };
    }

    // Check if service has bookings
    const hasBookings = await prisma.booking.count({
      where: { serviceId: serviceId },
    });

    if (hasBookings > 0) {
      return {
        success: false,
        error: "Cannot delete service with existing bookings. Archive it instead.",
      };
    }

    // Delete service (extras will be cascade deleted)
    await prisma.diveService.delete({
      where: { id: serviceId },
    });

    revalidatePath("/center/services");

    return { success: true };
  } catch (error) {
    console.error("Error deleting service:", error);
    return { success: false, error: "Failed to delete service" };
  }
}

/**
 * Duplicate a service with all its extras
 */
export async function duplicateService(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const center = await verifyCenterOwnership(session.user.id);
    if (!center) {
      return { success: false, error: "No approved center found" };
    }

    const serviceId = formData.get("id") as string;
    const newNameRaw = formData.get("newName");
    const newName = newNameRaw ? JSON.parse(newNameRaw as string) : undefined;

    const parsed = duplicateServiceSchema.safeParse({ id: serviceId, newName });
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    // Verify ownership
    const isOwner = await verifyServiceOwnership(serviceId, center.id);
    if (!isOwner) {
      return { success: false, error: "Service not found" };
    }

    // Get the original service with extras
    const original = await prisma.diveService.findUnique({
      where: { id: serviceId },
      include: { extras: true },
    });

    if (!original) {
      return { success: false, error: "Service not found" };
    }

    // Create duplicated name
    const originalName = original.name as LocalizedJson;
    const duplicatedName = newName || {
      fr: `${originalName.fr || ""} (copie)`,
      en: originalName.en ? `${originalName.en} (copy)` : undefined,
      es: originalName.es ? `${originalName.es} (copia)` : undefined,
      it: originalName.it ? `${originalName.it} (copia)` : undefined,
      de: originalName.de ? `${originalName.de} (Kopie)` : undefined,
    };

    // Create the duplicate in a transaction
    const newService = await prisma.$transaction(async (tx) => {
      const service = await tx.diveService.create({
        data: {
          centerId: center.id,
          categoryId: original.categoryId,
          name: duplicatedName as Prisma.InputJsonValue,
          description: original.description as Prisma.InputJsonValue | undefined,
          price: original.price,
          currency: original.currency,
          pricePerPerson: original.pricePerPerson,
          durationMinutes: original.durationMinutes,
          minParticipants: original.minParticipants,
          maxParticipants: original.maxParticipants,
          minCertification: original.minCertification,
          minAge: original.minAge,
          maxDepth: original.maxDepth,
          equipmentIncluded: original.equipmentIncluded,
          equipmentDetails: original.equipmentDetails,
          includes: original.includes,
          photos: original.photos,
          availableDays: original.availableDays,
          startTimes: original.startTimes,
          isActive: true,
        },
      });

      // Duplicate extras
      if (original.extras.length > 0) {
        await tx.serviceExtra.createMany({
          data: original.extras.map((extra) => ({
            serviceId: service.id,
            name: extra.name as Prisma.InputJsonValue,
            description: extra.description as Prisma.InputJsonValue | undefined,
            price: extra.price,
            multiplyByPax: extra.multiplyByPax,
            isRequired: extra.isRequired,
            isActive: extra.isActive,
          })),
        });
      }

      return service;
    });

    revalidatePath("/center/services");

    return { success: true, serviceId: newService.id };
  } catch (error) {
    console.error("Error duplicating service:", error);
    return { success: false, error: "Failed to duplicate service" };
  }
}

/**
 * Add an extra to a service
 */
export async function createExtra(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const center = await verifyCenterOwnership(session.user.id);
    if (!center) {
      return { success: false, error: "No approved center found" };
    }

    const serviceId = formData.get("serviceId") as string;
    const rawData = {
      serviceId,
      name: JSON.parse(formData.get("name") as string),
      description: formData.get("description")
        ? JSON.parse(formData.get("description") as string)
        : undefined,
      price: parseFloat(formData.get("price") as string),
      multiplyByPax: formData.get("multiplyByPax") === "true",
      isRequired: formData.get("isRequired") === "true",
    };

    const parsed = createExtraSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // Verify service ownership
    const isOwner = await verifyServiceOwnership(serviceId, center.id);
    if (!isOwner) {
      return { success: false, error: "Service not found" };
    }

    const extra = await prisma.serviceExtra.create({
      data: {
        serviceId: parsed.data.serviceId,
        name: parsed.data.name as Prisma.InputJsonValue,
        description: parsed.data.description as Prisma.InputJsonValue | undefined,
        price: parsed.data.price,
        multiplyByPax: parsed.data.multiplyByPax,
        isRequired: parsed.data.isRequired,
        isActive: true,
      },
    });

    revalidatePath("/center/services");
    revalidatePath(`/center/services/${serviceId}/edit`);

    return { success: true, extraId: extra.id };
  } catch (error) {
    console.error("Error creating extra:", error);
    return { success: false, error: "Failed to create extra" };
  }
}

/**
 * Update an extra
 */
export async function updateExtra(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const center = await verifyCenterOwnership(session.user.id);
    if (!center) {
      return { success: false, error: "No approved center found" };
    }

    const extraId = formData.get("id") as string;
    const serviceId = formData.get("serviceId") as string;

    const rawData = {
      id: extraId,
      serviceId,
      name: JSON.parse(formData.get("name") as string),
      description: formData.get("description")
        ? JSON.parse(formData.get("description") as string)
        : undefined,
      price: parseFloat(formData.get("price") as string),
      multiplyByPax: formData.get("multiplyByPax") === "true",
      isRequired: formData.get("isRequired") === "true",
    };

    const parsed = updateExtraSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // Verify service ownership
    const isOwner = await verifyServiceOwnership(serviceId, center.id);
    if (!isOwner) {
      return { success: false, error: "Service not found" };
    }

    await prisma.serviceExtra.update({
      where: { id: extraId },
      data: {
        name: parsed.data.name as Prisma.InputJsonValue,
        description: parsed.data.description as Prisma.InputJsonValue | undefined,
        price: parsed.data.price,
        multiplyByPax: parsed.data.multiplyByPax,
        isRequired: parsed.data.isRequired,
      },
    });

    revalidatePath("/center/services");
    revalidatePath(`/center/services/${serviceId}/edit`);

    return { success: true, extraId };
  } catch (error) {
    console.error("Error updating extra:", error);
    return { success: false, error: "Failed to update extra" };
  }
}

/**
 * Delete an extra
 */
export async function deleteExtra(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const center = await verifyCenterOwnership(session.user.id);
    if (!center) {
      return { success: false, error: "No approved center found" };
    }

    const extraId = formData.get("id") as string;

    const parsed = deleteExtraSchema.safeParse({ id: extraId });
    if (!parsed.success) {
      return { success: false, error: "Invalid extra ID" };
    }

    // Get the extra to find its service
    const extra = await prisma.serviceExtra.findUnique({
      where: { id: extraId },
      select: { serviceId: true },
    });

    if (!extra) {
      return { success: false, error: "Extra not found" };
    }

    // Verify service ownership
    const isOwner = await verifyServiceOwnership(extra.serviceId, center.id);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.serviceExtra.delete({
      where: { id: extraId },
    });

    revalidatePath("/center/services");
    revalidatePath(`/center/services/${extra.serviceId}/edit`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting extra:", error);
    return { success: false, error: "Failed to delete extra" };
  }
}
