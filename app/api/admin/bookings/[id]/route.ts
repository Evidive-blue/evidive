import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REFUNDED"]).optional(),
  specialRequests: z.string().max(1000).optional(),
});

// GET - Get booking details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        center: {
          select: {
            id: true,
            slug: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            country: true,
            owner: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
          },
        },
        diver: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            phone: true,
            certificationLevel: true,
            certificationOrg: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            durationMinutes: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        couponUses: {
          select: {
            discountApplied: true,
            coupon: {
              select: {
                code: true,
                discountType: true,
                discountValue: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PATCH - Update booking (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
      
      // Set completion timestamp
      if (parsed.data.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
      if (parsed.data.status === "CANCELLED") {
        updateData.cancelledAt = new Date();
      }
    }
    
    if (parsed.data.specialRequests !== undefined) {
      updateData.specialRequests = parsed.data.specialRequests;
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        status: true,
        specialRequests: true,
        completedAt: true,
        cancelledAt: true,
        diver: {
          select: {
            email: true,
            displayName: true,
          },
        },
        center: {
          select: {
            name: true,
          },
        },
      },
    });

    // TODO: Send notification email to diver about status change
    // await sendBookingStatusEmail(booking.diver.email, booking.status);

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE - Delete booking (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Delete related records first, then the booking
    await prisma.$transaction([
      prisma.couponUse.deleteMany({ where: { bookingId: id } }),
      prisma.review.deleteMany({ where: { bookingId: id } }),
      prisma.booking.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
