import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  role: z.enum(["DIVER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  isBlacklisted: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  displayName: z.string().max(100).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
});

// GET - Get user details (admin only)
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

    const user = await prisma.diver.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        phone: true,
        address: true,
        city: true,
        zip: true,
        country: true,
        role: true,
        certificationLevel: true,
        certificationOrg: true,
        totalDives: true,
        preferredLanguage: true,
        emailNotifications: true,
        smsNotifications: true,
        emailVerified: true,
        emailVerifiedAt: true,
        isActive: true,
        isBlacklisted: true,
        createdAt: true,
        updatedAt: true,
        centers: {
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
            city: true,
            country: true,
          },
        },
        bookings: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            totalPrice: true,
            status: true,
            diveDate: true,
            center: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            center: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            centers: true,
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH - Update user (admin only)
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
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.diver.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent admin from demoting themselves
    if (id === session.user.id && parsed.data.role === "DIVER") {
      return NextResponse.json(
        { error: "Cannot demote yourself" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
    if (parsed.data.isBlacklisted !== undefined) updateData.isBlacklisted = parsed.data.isBlacklisted;
    if (parsed.data.emailVerified !== undefined) {
      updateData.emailVerified = parsed.data.emailVerified;
      if (parsed.data.emailVerified) {
        updateData.emailVerifiedAt = new Date();
      }
    }
    if (parsed.data.displayName !== undefined) updateData.displayName = parsed.data.displayName;
    if (parsed.data.firstName !== undefined) updateData.firstName = parsed.data.firstName;
    if (parsed.data.lastName !== undefined) updateData.lastName = parsed.data.lastName;

    // Update user
    const user = await prisma.diver.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        isBlacklisted: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (admin only)
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

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.diver.findUnique({
      where: { id },
      select: { id: true, email: true, _count: { select: { centers: true } } },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If user owns centers, prevent deletion
    if (user._count.centers > 0) {
      return NextResponse.json(
        { error: "Cannot delete user who owns dive centers. Transfer or delete centers first." },
        { status: 400 }
      );
    }

    // Delete related records first, then the user
    await prisma.$transaction([
      prisma.couponUse.deleteMany({ where: { booking: { diverId: id } } }),
      prisma.booking.deleteMany({ where: { diverId: id } }),
      prisma.review.deleteMany({ where: { diverId: id } }),
      prisma.diver.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
