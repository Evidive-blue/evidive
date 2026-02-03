import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED", "PENDING"]).optional(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  reason: z.string().optional(),
});

// GET - Get center details (admin only)
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

    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            phone: true,
            createdAt: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!center) {
      return NextResponse.json(
        { error: "Center not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ center });
  } catch (error) {
    console.error("Error fetching center:", error);
    return NextResponse.json(
      { error: "Failed to fetch center" },
      { status: 500 }
    );
  }
}

// PATCH - Update center status (approve/reject/suspend)
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
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, verified, featured } = parsed.data;

    // Check if center exists
    const existingCenter = await prisma.center.findUnique({
      where: { id },
      select: { id: true, status: true, ownerId: true },
    });

    if (!existingCenter) {
      return NextResponse.json(
        { error: "Center not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (status !== undefined) {
      updateData.status = status;
      if (status === "APPROVED") {
        updateData.approvedAt = new Date();
      }
    }
    
    if (verified !== undefined) {
      updateData.verified = verified;
    }
    
    if (featured !== undefined) {
      updateData.featured = featured;
    }

    // Update center
    const center = await prisma.center.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        verified: true,
        featured: true,
        owner: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
    });

    // TODO: Send notification email to owner about status change
    // await sendStatusChangeEmail(center.owner.email, status, reason);

    return NextResponse.json({
      success: true,
      message: "Center updated successfully",
      center,
    });
  } catch (error) {
    console.error("Error updating center status:", error);
    return NextResponse.json(
      { error: "Failed to update center status" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a center (admin only)
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

    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!center) {
      return NextResponse.json(
        { error: "Center not found" },
        { status: 404 }
      );
    }

    // Delete related records first, then the center
    await prisma.$transaction([
      prisma.couponUse.deleteMany({ where: { booking: { centerId: id } } }),
      prisma.booking.deleteMany({ where: { centerId: id } }),
      prisma.review.deleteMany({ where: { centerId: id } }),
      prisma.service.deleteMany({ where: { centerId: id } }),
      prisma.center.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Center deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting center:", error);
    return NextResponse.json(
      { error: "Failed to delete center" },
      { status: 500 }
    );
  }
}
