"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@prisma/client";

/**
 * Generate a unique booking reference
 */
function generateReference(): string {
  const prefix = "EVD";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Get the authenticated user's center
 */
async function getAuthorizedCenter() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  if (
    session.user.userType !== "CENTER_OWNER" &&
    session.user.userType !== "ADMIN"
  ) {
    return null;
  }

  const center = await prisma.diveCenter.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, ownerId: true },
  });

  return center;
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  cancellationReason?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    const center = await getAuthorizedCenter();

    if (!center) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, centerId: center.id },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    switch (newStatus) {
      case "CONFIRMED":
        updateData.confirmedAt = new Date();
        updateData.confirmedById = session?.user?.id;
        break;
      case "CANCELLED":
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = "CENTER";
        updateData.cancellationReason = cancellationReason || "Cancelled by center";
        break;
      case "COMPLETED":
        updateData.completedAt = new Date();
        break;
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    // Create notification for customer
    if (booking.userId) {
      const notificationMessages: Record<string, { title: string; message: string }> = {
        CONFIRMED: {
          title: "Réservation confirmée",
          message: `Votre réservation ${booking.reference} a été confirmée.`,
        },
        CANCELLED: {
          title: "Réservation annulée",
          message: `Votre réservation ${booking.reference} a été annulée par le centre.`,
        },
        COMPLETED: {
          title: "Plongée terminée",
          message: `Votre plongée ${booking.reference} est terminée. N'hésitez pas à laisser un avis !`,
        },
      };

      const notif = notificationMessages[newStatus];
      if (notif) {
        await prisma.notification.create({
          data: {
            userId: booking.userId,
            type: `BOOKING_${newStatus}`,
            title: notif.title,
            message: notif.message,
            linkUrl: `/bookings/${booking.id}`,
            linkText: "Voir ma réservation",
            bookingId: booking.id,
          },
        });
      }
    }

    revalidatePath("/center");
    revalidatePath("/center/bookings");

    return { success: true };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Create a manual booking
 */
export async function createManualBooking(data: {
  serviceId: string;
  diveDate: Date;
  diveTime: string;
  participants: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
  certificationLevel?: string;
  extraIds?: string[];
}): Promise<{
  success: boolean;
  bookingId?: string;
  error?: string;
}> {
  try {
    const center = await getAuthorizedCenter();

    if (!center) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the service
    const service = await prisma.diveService.findFirst({
      where: { id: data.serviceId, centerId: center.id },
      include: { extras: { where: { isActive: true } } },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    // Validate participants
    if (
      data.participants < service.minParticipants ||
      data.participants > service.maxParticipants
    ) {
      return {
        success: false,
        error: `Participants must be between ${service.minParticipants} and ${service.maxParticipants}`,
      };
    }

    // Parse time
    const [hours, minutes] = data.diveTime.split(":").map(Number);
    const diveTime = new Date(1970, 0, 1, hours, minutes);

    // Calculate prices
    const unitPrice = Number(service.price);
    const basePrice = service.pricePerPerson
      ? unitPrice * data.participants
      : unitPrice;

    let extrasPrice = 0;
    const selectedExtras: { extraId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

    if (data.extraIds && data.extraIds.length > 0) {
      for (const extraId of data.extraIds) {
        const extra = service.extras.find((e) => e.id === extraId);
        if (extra) {
          const qty = extra.multiplyByPax ? data.participants : 1;
          const total = Number(extra.price) * qty;
          extrasPrice += total;
          selectedExtras.push({
            extraId,
            quantity: qty,
            unitPrice: Number(extra.price),
            totalPrice: total,
          });
        }
      }
    }

    const totalPrice = basePrice + extrasPrice;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        reference: generateReference(),
        centerId: center.id,
        serviceId: data.serviceId,
        diveDate: data.diveDate,
        diveTime,
        durationMinutes: service.durationMinutes,
        participants: data.participants,
        guestFirstName: data.guestFirstName,
        guestLastName: data.guestLastName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone || null,
        specialRequests: data.specialRequests || null,
        certificationLevel: data.certificationLevel || null,
        unitPrice,
        extrasPrice,
        totalPrice,
        currency: service.currency,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        source: "manual",
        extras: {
          create: selectedExtras.map((e) => ({
            extraId: e.extraId,
            quantity: e.quantity,
            unitPrice: e.unitPrice,
            totalPrice: e.totalPrice,
          })),
        },
      },
    });

    // Update center booking count
    await prisma.diveCenter.update({
      where: { id: center.id },
      data: { bookingCount: { increment: 1 } },
    });

    revalidatePath("/center");
    revalidatePath("/center/bookings");

    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error("Error creating manual booking:", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Export bookings to CSV format
 */
export async function exportBookingsCSV(filters?: {
  status?: BookingStatus;
  dateFrom?: Date;
  dateTo?: Date;
  serviceId?: string;
  search?: string;
}): Promise<{
  success: boolean;
  csv?: string;
  error?: string;
}> {
  try {
    const center = await getAuthorizedCenter();

    if (!center) {
      return { success: false, error: "Unauthorized" };
    }

    // Build where clause
    const where: Record<string, unknown> = { centerId: center.id };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.diveDate = {};
      if (filters.dateFrom) {
        (where.diveDate as Record<string, unknown>).gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (where.diveDate as Record<string, unknown>).lte = filters.dateTo;
      }
    }

    if (filters?.serviceId) {
      where.serviceId = filters.serviceId;
    }

    if (filters?.search) {
      where.OR = [
        { reference: { contains: filters.search, mode: "insensitive" } },
        { guestFirstName: { contains: filters.search, mode: "insensitive" } },
        { guestLastName: { contains: filters.search, mode: "insensitive" } },
        { guestEmail: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: { select: { name: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        extras: { include: { extra: { select: { name: true } } } },
      },
      orderBy: { diveDate: "desc" },
    });

    // Generate CSV
    const headers = [
      "Référence",
      "Date",
      "Heure",
      "Service",
      "Client",
      "Email",
      "Téléphone",
      "Participants",
      "Total",
      "Statut",
      "Source",
      "Créé le",
    ];

    const getLocalizedName = (name: unknown): string => {
      if (!name || typeof name !== "object") return "";
      const obj = name as Record<string, string>;
      return obj.fr || obj.en || Object.values(obj)[0] || "";
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = bookings.map((b: any) => {
      const clientName = b.user
        ? `${b.user.firstName || ""} ${b.user.lastName || ""}`.trim()
        : `${b.guestFirstName || ""} ${b.guestLastName || ""}`.trim();
      const email = b.user?.email || b.guestEmail;

      return [
        b.reference,
        b.diveDate.toISOString().split("T")[0],
        b.diveTime.toTimeString().slice(0, 5),
        getLocalizedName(b.service.name),
        clientName,
        email,
        b.guestPhone || "",
        b.participants.toString(),
        `${Number(b.totalPrice).toFixed(2)} ${b.currency}`,
        b.status,
        b.source,
        b.createdAt.toISOString().split("T")[0],
      ];
    });

    const csv = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")),
    ].join("\n");

    return { success: true, csv };
  } catch (error) {
    console.error("Error exporting bookings:", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Get center services for manual booking form
 */
export async function getCenterServices(): Promise<{
  success: boolean;
  services?: Array<{
    id: string;
    name: Record<string, string>;
    price: number;
    currency: string;
    durationMinutes: number;
    minParticipants: number;
    maxParticipants: number;
    pricePerPerson: boolean;
    startTimes: string[];
    extras: Array<{
      id: string;
      name: Record<string, string>;
      price: number;
      multiplyByPax: boolean;
    }>;
  }>;
  error?: string;
}> {
  try {
    const center = await getAuthorizedCenter();

    if (!center) {
      return { success: false, error: "Unauthorized" };
    }

    const services = await prisma.diveService.findMany({
      where: { centerId: center.id, isActive: true },
      include: {
        extras: { where: { isActive: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      services: services.map((s: any) => ({
        id: s.id,
        name: s.name as Record<string, string>,
        price: Number(s.price),
        currency: s.currency,
        durationMinutes: s.durationMinutes,
        minParticipants: s.minParticipants,
        maxParticipants: s.maxParticipants,
        pricePerPerson: s.pricePerPerson,
        startTimes: s.startTimes,
        extras: s.extras.map((e: any) => ({
          id: e.id,
          name: e.name as Record<string, string>,
          price: Number(e.price),
          multiplyByPax: e.multiplyByPax,
        })),
      })),
    };
  } catch (error) {
    console.error("Error getting services:", error);
    return { success: false, error: "An error occurred" };
  }
}
