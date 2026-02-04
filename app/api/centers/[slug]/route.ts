import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateCenterSchema = z.object({
  name: z.object({
    fr: z.string().min(2),
    en: z.string().optional(),
  }).optional(),
  description: z.object({
    fr: z.string().min(10),
    en: z.string().optional(),
  }).optional(),
  shortDescription: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  address: z.string().min(5).optional(),
  street2: z.string().optional().nullable(),
  city: z.string().min(2).optional(),
  region: z.string().optional().nullable(),
  country: z.string().min(2).optional(),
  zip: z.string().optional().nullable(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  website: z.string().url().or(z.literal('')).optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  certifications: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  equipmentRental: z.boolean().optional(),
  ecoCommitment: z.string().optional().nullable(),
  cancellationHours: z.number().min(0).optional(),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).optional(),
  featuredImage: z.string().optional().nullable(),
  photos: z.array(z.string()).optional(),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET - Get center by slug (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const center = await prisma.center.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            diver: {
              select: { displayName: true, firstName: true, avatarUrl: true },
            },
          },
        },
        workers: {
          where: { isActive: true },
        },
        _count: {
          select: { reviews: true, bookings: true },
        },
      },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    // Only return approved centers publicly
    if (center.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    return NextResponse.json(center);
  } catch (error) {
    console.error('Error fetching center:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update center (owner only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Find center and check ownership
    const center = await prisma.center.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updateCenterSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription || null;
    if (data.address) updateData.address = data.address;
    if (data.street2 !== undefined) updateData.street2 = data.street2 || null;
    if (data.city) updateData.city = data.city;
    if (data.region !== undefined) updateData.region = data.region || null;
    if (data.country) updateData.country = data.country;
    if (data.zip !== undefined) updateData.zip = data.zip || null;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (data.facebook !== undefined) updateData.facebook = data.facebook || null;
    if (data.instagram !== undefined) updateData.instagram = data.instagram || null;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp || null;
    if (data.certifications) updateData.certifications = data.certifications;
    if (data.languagesSpoken) updateData.languagesSpoken = data.languagesSpoken;
    if (data.equipmentRental !== undefined) updateData.equipmentRental = data.equipmentRental;
    if (data.ecoCommitment !== undefined) updateData.ecoCommitment = data.ecoCommitment || null;
    if (data.cancellationHours !== undefined) updateData.cancellationHours = data.cancellationHours;
    if (data.cancellationPolicy) updateData.cancellationPolicy = data.cancellationPolicy;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage || null;
    if (data.photos !== undefined) updateData.photos = data.photos;

    const updatedCenter = await prisma.center.update({
      where: { id: center.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      center: {
        id: updatedCenter.id,
        slug: updatedCenter.slug,
      },
    });
  } catch (error) {
    console.error('Error updating center:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
