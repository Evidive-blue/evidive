import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// Schema for center creation
const createCenterSchema = z.object({
  // Basic Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  shortDescription: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  
  // Location
  address: z.string().optional(),
  city: z.string().min(1, "City is required"),
  region: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().optional(),
  
  // Services
  diveTypes: z.array(z.string()).min(1, "Select at least one dive type"),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  equipmentRental: z.boolean().optional(),
  accommodationPartners: z.boolean().optional(),
  transportIncluded: z.boolean().optional(),
  
  // Legal
  businessName: z.string().optional(),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms"),
});

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Math.random().toString(36).substring(2, 8);
}

// POST - Create a new center
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createCenterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = generateSlug(data.name);

    // Create the center
    const center = await prisma.center.create({
      data: {
        slug,
        name: { en: data.name, fr: data.name },
        description: data.description 
          ? { en: data.description, fr: data.description } 
          : { en: "No description provided", fr: "Aucune description fournie" },
        shortDescription: data.shortDescription 
          ? { en: data.shortDescription, fr: data.shortDescription } 
          : undefined,
        website: data.website || null,
        email: data.email,
        phone: data.phone || "+0000000000", // Required field
        
        // Location
        address: data.address || "Address to be confirmed",
        city: data.city,
        region: data.region || null,
        country: data.country,
        zip: data.postalCode || null,
        latitude: 0, // Will be updated later with geocoding
        longitude: 0, // Will be updated later with geocoding
        
        // Services
        certifications: data.certifications || [],
        languagesSpoken: data.languages || [],
        equipmentRental: data.equipmentRental || false,
        
        // Status
        status: "PENDING",
        
        // Owner relation
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Center created successfully. It will be reviewed by our team.",
      center: {
        id: center.id,
        slug: center.slug,
        status: center.status,
      },
    });
  } catch (error) {
    console.error("Error creating center:", error);
    return NextResponse.json(
      { error: "Failed to create center" },
      { status: 500 }
    );
  }
}

// GET - List user's centers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const centers = await prisma.center.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        country: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ centers });
  } catch (error) {
    console.error("Error fetching centers:", error);
    return NextResponse.json(
      { error: "Failed to fetch centers" },
      { status: 500 }
    );
  }
}
