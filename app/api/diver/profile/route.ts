import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// ============================================
// Validation Schema
// ============================================
const updateProfileSchema = z.object({
  // Basic info
  displayName: z.string().max(100).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  
  // Address
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  
  // Diving info
  certificationLevel: z.string().max(50).optional(),
  certificationOrg: z.string().max(50).optional(),
  totalDives: z.number().int().min(0).optional().nullable(),
  
  // Preferences
  preferredDiveTypes: z.array(z.string()).optional(),
  preferredLanguage: z.string().max(10).optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }).optional(),
  timezone: z.string().max(50).optional(),
});

// ============================================
// GET - Get current user's profile
// ============================================
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const diver = await prisma.diver.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
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
        timezone: true,
        emailVerified: true,
        createdAt: true,
        // Include owned centers count
        _count: {
          select: {
            centers: true,
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!diver) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: diver });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Update current user's profile
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build update object
    const updateData: Record<string, unknown> = {};

    // Basic info
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    
    // Address
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.zip !== undefined) updateData.zip = data.zip;
    if (data.country !== undefined) updateData.country = data.country;
    
    // Diving info
    if (data.certificationLevel !== undefined) updateData.certificationLevel = data.certificationLevel;
    if (data.certificationOrg !== undefined) updateData.certificationOrg = data.certificationOrg;
    if (data.totalDives !== undefined) updateData.totalDives = data.totalDives;
    
    // Preferences
    if (data.preferredLanguage !== undefined) updateData.preferredLanguage = data.preferredLanguage;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    
    // Notification preferences (flattened)
    if (data.notificationPreferences) {
      updateData.emailNotifications = data.notificationPreferences.email;
      updateData.smsNotifications = data.notificationPreferences.sms;
      // Note: push notifications would need a separate field if implemented
    }

    // Update the profile
    const updatedDiver = await prisma.diver.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        certificationLevel: true,
        certificationOrg: true,
        totalDives: true,
        preferredLanguage: true,
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedDiver,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
