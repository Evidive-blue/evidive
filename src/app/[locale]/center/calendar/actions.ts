"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for blocking a date
const blockDateSchema = z.object({
  centerId: z.string().min(1),
  blockedDate: z.string().transform((str) => new Date(str)),
  reason: z.string().optional(),
  allDay: z.boolean().default(true),
  blockedTimes: z.array(z.string()).default([]),
});

// Schema for unblocking a date
const unblockDateSchema = z.object({
  id: z.string().min(1),
  centerId: z.string().min(1),
});

// Schema for adding a manual booking
const manualBookingSchema = z.object({
  centerId: z.string().min(1),
  serviceId: z.string().min(1),
  diveDate: z.string().transform((str) => new Date(str)),
  diveTime: z.string(),
  participants: z.number().min(1).max(50),
  guestFirstName: z.string().min(1),
  guestLastName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  specialRequests: z.string().optional(),
});

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Block a date for a center
 */
export async function blockDateAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "unauthorized" };
  }

  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    return { success: false, error: "forbidden" };
  }

  try {
    const raw = {
      centerId: formData.get("centerId"),
      blockedDate: formData.get("blockedDate"),
      reason: formData.get("reason") || undefined,
      allDay: formData.get("allDay") === "true",
      blockedTimes: formData.getAll("blockedTimes").map(String),
    };

    const parsed = blockDateSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return { success: false, error: "validation_error" };
    }

    const { centerId, blockedDate, reason, allDay, blockedTimes } = parsed.data;

    // Verify user owns this center (if not admin)
    if (userType === "CENTER_OWNER") {
      const center = await prisma.diveCenter.findFirst({
        where: { id: centerId, ownerId: session.user.id },
      });
      if (!center) {
        return { success: false, error: "center_not_found" };
      }
    }

    // Check if date is already blocked
    const existingBlock = await prisma.centerBlockedDate.findUnique({
      where: {
        centerId_blockedDate: {
          centerId,
          blockedDate: new Date(blockedDate.toISOString().split('T')[0]),
        },
      },
    });

    if (existingBlock) {
      // Update existing block
      await prisma.centerBlockedDate.update({
        where: { id: existingBlock.id },
        data: {
          reason,
          allDay,
          blockedTimes,
        },
      });
    } else {
      // Create new block
      await prisma.centerBlockedDate.create({
        data: {
          centerId,
          blockedDate: new Date(blockedDate.toISOString().split('T')[0]),
          reason,
          allDay,
          blockedTimes,
        },
      });
    }

    revalidatePath("/center/calendar");
    return { success: true };
  } catch (error) {
    console.error("Error blocking date:", error);
    return { success: false, error: "server_error" };
  }
}

/**
 * Unblock a date for a center
 */
export async function unblockDateAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "unauthorized" };
  }

  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    return { success: false, error: "forbidden" };
  }

  try {
    const raw = {
      id: formData.get("id"),
      centerId: formData.get("centerId"),
    };

    const parsed = unblockDateSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: "validation_error" };
    }

    const { id, centerId } = parsed.data;

    // Verify user owns this center (if not admin)
    if (userType === "CENTER_OWNER") {
      const center = await prisma.diveCenter.findFirst({
        where: { id: centerId, ownerId: session.user.id },
      });
      if (!center) {
        return { success: false, error: "center_not_found" };
      }
    }

    // Delete the blocked date
    await prisma.centerBlockedDate.delete({
      where: { id },
    });

    revalidatePath("/center/calendar");
    return { success: true };
  } catch (error) {
    console.error("Error unblocking date:", error);
    return { success: false, error: "server_error" };
  }
}

/**
 * Add a manual booking
 */
export async function addManualBookingAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "unauthorized" };
  }

  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    return { success: false, error: "forbidden" };
  }

  try {
    const raw = {
      centerId: formData.get("centerId"),
      serviceId: formData.get("serviceId"),
      diveDate: formData.get("diveDate"),
      diveTime: formData.get("diveTime"),
      participants: parseInt(formData.get("participants") as string, 10) || 1,
      guestFirstName: formData.get("guestFirstName"),
      guestLastName: formData.get("guestLastName"),
      guestEmail: formData.get("guestEmail"),
      guestPhone: formData.get("guestPhone") || undefined,
      specialRequests: formData.get("specialRequests") || undefined,
    };

    const parsed = manualBookingSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return { success: false, error: "validation_error" };
    }

    const {
      centerId,
      serviceId,
      diveDate,
      diveTime,
      participants,
      guestFirstName,
      guestLastName,
      guestEmail,
      guestPhone,
      specialRequests,
    } = parsed.data;

    // Verify user owns this center (if not admin)
    if (userType === "CENTER_OWNER") {
      const center = await prisma.diveCenter.findFirst({
        where: { id: centerId, ownerId: session.user.id },
      });
      if (!center) {
        return { success: false, error: "center_not_found" };
      }
    }

    // Get service details for pricing
    const service = await prisma.diveService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { success: false, error: "service_not_found" };
    }

    // Parse time string to Date
    const [hours, minutes] = diveTime.split(":").map(Number);
    const timeDate = new Date(1970, 0, 1, hours, minutes, 0);

    // Generate unique reference
    const reference = `MAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Calculate total price
    const totalPrice = service.pricePerPerson
      ? service.price.toNumber() * participants
      : service.price.toNumber();

    // Create manual booking
    const booking = await prisma.booking.create({
      data: {
        reference,
        centerId,
        serviceId,
        diveDate: new Date(diveDate.toISOString().split('T')[0]),
        diveTime: timeDate,
        participants,
        guestFirstName,
        guestLastName,
        guestEmail,
        guestPhone,
        specialRequests,
        unitPrice: service.price,
        totalPrice,
        currency: service.currency,
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        source: "manual",
        confirmedById: session.user.id,
        confirmedAt: new Date(),
      },
    });

    revalidatePath("/center/calendar");
    return { success: true, data: { bookingId: booking.id, reference: booking.reference } };
  } catch (error) {
    console.error("Error creating manual booking:", error);
    return { success: false, error: "server_error" };
  }
}

/**
 * Block a specific slot (close a time slot)
 */
export async function closeSlotAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "unauthorized" };
  }

  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    return { success: false, error: "forbidden" };
  }

  try {
    const centerId = formData.get("centerId") as string;
    const blockedDate = formData.get("blockedDate") as string;
    const blockedTime = formData.get("blockedTime") as string;
    const reason = formData.get("reason") as string || "Slot closed by center";

    if (!centerId || !blockedDate || !blockedTime) {
      return { success: false, error: "validation_error" };
    }

    // Verify user owns this center (if not admin)
    if (userType === "CENTER_OWNER") {
      const center = await prisma.diveCenter.findFirst({
        where: { id: centerId, ownerId: session.user.id },
      });
      if (!center) {
        return { success: false, error: "center_not_found" };
      }
    }

    const dateOnly = new Date(blockedDate.split('T')[0]);

    // Check if date already has blocked times
    const existingBlock = await prisma.centerBlockedDate.findUnique({
      where: {
        centerId_blockedDate: {
          centerId,
          blockedDate: dateOnly,
        },
      },
    });

    if (existingBlock) {
      if (existingBlock.allDay) {
        // Already fully blocked
        return { success: true };
      }
      // Add this time to blocked times
      const newBlockedTimes = [...new Set([...existingBlock.blockedTimes, blockedTime])];
      await prisma.centerBlockedDate.update({
        where: { id: existingBlock.id },
        data: { blockedTimes: newBlockedTimes },
      });
    } else {
      // Create new partial block
      await prisma.centerBlockedDate.create({
        data: {
          centerId,
          blockedDate: dateOnly,
          reason,
          allDay: false,
          blockedTimes: [blockedTime],
        },
      });
    }

    revalidatePath("/center/calendar");
    return { success: true };
  } catch (error) {
    console.error("Error closing slot:", error);
    return { success: false, error: "server_error" };
  }
}
