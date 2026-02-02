"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mailer";

/**
 * Verifies that the current user owns the center associated with a booking.
 * Returns the booking if authorized, null otherwise.
 */
async function getAuthorizedBooking(bookingId: string) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // Only CENTER_OWNER and ADMIN can manage bookings
  if (
    session.user.userType !== "CENTER_OWNER" &&
    session.user.userType !== "ADMIN"
  ) {
    return null;
  }

  // Get the booking with center and user info
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      center: {
        select: {
          id: true,
          ownerId: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!booking) {
    return null;
  }

  // ADMIN can manage any booking
  if (session.user.userType === "ADMIN") {
    return booking;
  }

  // CENTER_OWNER can only manage their own center's bookings
  if (booking.center.ownerId !== session.user.id) {
    return null;
  }

  return booking;
}

/**
 * Confirms a pending booking.
 * Changes status from PENDING to CONFIRMED.
 */
export async function confirmBooking(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const booking = await getAuthorizedBooking(bookingId);

    if (!booking) {
      return {
        success: false,
        error: "Booking not found or unauthorized",
      };
    }

    if (booking.status !== "PENDING") {
      return {
        success: false,
        error: `Cannot confirm booking with status: ${booking.status}`,
      };
    }

    const session = await auth();

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmedById: session?.user?.id,
      },
    });

    // Update center booking count
    await prisma.diveCenter.update({
      where: { id: booking.centerId },
      data: {
        bookingCount: {
          increment: 1,
        },
      },
    });

    // Create notification for the customer
    if (booking.userId) {
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_CONFIRMED",
          title: "Réservation confirmée",
          message: `Votre réservation ${booking.reference} a été confirmée.`,
          linkUrl: `/bookings/${booking.id}`,
          linkText: "Voir ma réservation",
          bookingId: booking.id,
        },
      });
    }

    // Send confirmation email to customer
    if (booking.user?.email) {
      const centerName = typeof booking.center.name === "object"
        ? (booking.center.name as Record<string, string>).fr || (booking.center.name as Record<string, string>).en || "le centre"
        : booking.center.name || "le centre";
      const customerName = booking.user.firstName || "Cher plongeur";

      await sendEmail({
        to: booking.user.email,
        subject: `Réservation confirmée - ${booking.reference}`,
        template: "booking-confirmed",
        html: `
          <h1>Votre réservation est confirmée !</h1>
          <p>Bonjour ${customerName},</p>
          <p>Nous avons le plaisir de vous confirmer votre réservation <strong>${booking.reference}</strong> auprès de <strong>${centerName}</strong>.</p>
          <p>Vous pouvez consulter les détails de votre réservation dans votre espace personnel.</p>
          <p>À bientôt sous l'eau !</p>
          <p>L'équipe EviDive</p>
        `,
        text: `Bonjour ${customerName}, votre réservation ${booking.reference} auprès de ${centerName} est confirmée.`,
        userId: booking.user.id,
        centerId: booking.centerId,
        metadata: { bookingId: booking.id, reference: booking.reference },
      }).catch((err) => {
        console.error("Failed to send confirmation email:", err);
      });
    }

    // Revalidate relevant pages
    revalidatePath("/center");
    revalidatePath("/center/bookings");
    revalidatePath(`/bookings/${booking.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error confirming booking:", error);
    return {
      success: false,
      error: "An error occurred while confirming the booking",
    };
  }
}

/**
 * Rejects a pending booking.
 * Changes status from PENDING to CANCELLED with CENTER as cancelledBy.
 */
export async function rejectBooking(
  bookingId: string,
  reason?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const booking = await getAuthorizedBooking(bookingId);

    if (!booking) {
      return {
        success: false,
        error: "Booking not found or unauthorized",
      };
    }

    if (booking.status !== "PENDING") {
      return {
        success: false,
        error: `Cannot reject booking with status: ${booking.status}`,
      };
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledBy: "CENTER",
        cancellationReason: reason || "Rejected by center",
        cancelledAt: new Date(),
      },
    });

    // Create notification for the customer
    if (booking.userId) {
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_CANCELLED",
          title: "Réservation refusée",
          message: `Votre réservation ${booking.reference} a été refusée par le centre.`,
          linkUrl: `/bookings/${booking.id}`,
          linkText: "Voir les détails",
          bookingId: booking.id,
        },
      });
    }

    // Send rejection email to customer
    if (booking.user?.email) {
      const centerName = typeof booking.center.name === "object"
        ? (booking.center.name as Record<string, string>).fr || (booking.center.name as Record<string, string>).en || "le centre"
        : booking.center.name || "le centre";
      const customerName = booking.user.firstName || "Cher plongeur";

      await sendEmail({
        to: booking.user.email,
        subject: `Réservation refusée - ${booking.reference}`,
        template: "booking-rejected",
        html: `
          <h1>Réservation non confirmée</h1>
          <p>Bonjour ${customerName},</p>
          <p>Nous sommes désolés de vous informer que votre réservation <strong>${booking.reference}</strong> auprès de <strong>${centerName}</strong> n'a pas pu être confirmée.</p>
          ${reason ? `<p><strong>Motif :</strong> ${reason}</p>` : ""}
          <p>N'hésitez pas à rechercher d'autres disponibilités ou à contacter le centre directement.</p>
          <p>L'équipe EviDive</p>
        `,
        text: `Bonjour ${customerName}, nous sommes désolés mais votre réservation ${booking.reference} n'a pas pu être confirmée.${reason ? ` Motif: ${reason}` : ""}`,
        userId: booking.user.id,
        centerId: booking.centerId,
        metadata: { bookingId: booking.id, reference: booking.reference, reason },
      }).catch((err) => {
        console.error("Failed to send rejection email:", err);
      });
    }

    // Revalidate relevant pages
    revalidatePath("/center");
    revalidatePath("/center/bookings");
    revalidatePath(`/bookings/${booking.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error rejecting booking:", error);
    return {
      success: false,
      error: "An error occurred while rejecting the booking",
    };
  }
}

/**
 * Marks a booking as completed after the dive.
 */
export async function completeBooking(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const booking = await getAuthorizedBooking(bookingId);

    if (!booking) {
      return {
        success: false,
        error: "Booking not found or unauthorized",
      };
    }

    if (!["CONFIRMED", "PAID", "RUNNING"].includes(booking.status)) {
      return {
        success: false,
        error: `Cannot complete booking with status: ${booking.status}`,
      };
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Create notification inviting customer to leave a review
    if (booking.userId) {
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "REVIEW_REQUEST",
          title: "Comment était votre plongée ?",
          message: `Partagez votre expérience et laissez un avis pour ${booking.reference}.`,
          linkUrl: `/reviews/new?bookingId=${booking.id}`,
          linkText: "Laisser un avis",
          bookingId: booking.id,
        },
      });
    }

    // Revalidate relevant pages
    revalidatePath("/center");
    revalidatePath("/center/bookings");
    revalidatePath(`/bookings/${booking.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error completing booking:", error);
    return {
      success: false,
      error: "An error occurred while completing the booking",
    };
  }
}

/**
 * Marks a customer as no-show for their booking.
 */
export async function markNoShow(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const booking = await getAuthorizedBooking(bookingId);

    if (!booking) {
      return {
        success: false,
        error: "Booking not found or unauthorized",
      };
    }

    if (!["CONFIRMED", "PAID", "RUNNING"].includes(booking.status)) {
      return {
        success: false,
        error: `Cannot mark no-show for booking with status: ${booking.status}`,
      };
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "NOSHOW",
      },
    });

    // Create notification for the customer
    if (booking.userId) {
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_NOSHOW",
          title: "Absence à votre réservation",
          message: `Vous n'êtes pas venu à votre réservation ${booking.reference}. Contactez-nous si vous avez des questions.`,
          bookingId: booking.id,
        },
      });
    }

    // Revalidate relevant pages
    revalidatePath("/center");
    revalidatePath("/center/bookings");
    revalidatePath(`/bookings/${booking.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error marking no-show:", error);
    return {
      success: false,
      error: "An error occurred while marking the booking as no-show",
    };
  }
}
