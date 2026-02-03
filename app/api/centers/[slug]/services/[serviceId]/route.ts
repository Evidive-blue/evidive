import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateServiceSchema = z.object({
  name: z.record(z.string()).optional(),
  description: z.record(z.string()).nullable().optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  minParticipants: z.number().int().positive().optional(),
  maxParticipants: z.number().int().positive().optional(),
  minCertification: z.string().nullable().optional(),
  minAge: z.number().int().min(8).optional(),
  maxDepth: z.number().int().nullable().optional(),
  equipmentIncluded: z.boolean().optional(),
  equipmentDetails: z.string().nullable().optional(),
  availableDays: z.array(z.string()).optional(),
  startTimes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/centers/[slug]/services/[serviceId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; serviceId: string }> }
) {
  try {
    const { slug, serviceId } = await params;

    const center = await prisma.center.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, centerId: center.id },
      include: {
        extras: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/centers/[slug]/services/[serviceId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; serviceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, serviceId } = await params;

    const center = await prisma.center.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, centerId: center.id },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = updateServiceSchema.parse(body);

    const updateData: Parameters<typeof prisma.service.update>[0]['data'] = {};
    
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description ?? undefined;
    if (data.price) updateData.price = data.price;
    if (data.currency) updateData.currency = data.currency;
    if (data.durationMinutes) updateData.durationMinutes = data.durationMinutes;
    if (data.minParticipants) updateData.minParticipants = data.minParticipants;
    if (data.maxParticipants) updateData.maxParticipants = data.maxParticipants;
    if (data.minCertification !== undefined) updateData.minCertification = data.minCertification;
    if (data.minAge) updateData.minAge = data.minAge;
    if (data.maxDepth !== undefined) updateData.maxDepth = data.maxDepth;
    if (data.equipmentIncluded !== undefined) updateData.equipmentIncluded = data.equipmentIncluded;
    if (data.equipmentDetails !== undefined) updateData.equipmentDetails = data.equipmentDetails;
    if (data.availableDays) updateData.availableDays = data.availableDays;
    if (data.startTimes) updateData.startTimes = data.startTimes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    return NextResponse.json({ service: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/centers/[slug]/services/[serviceId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; serviceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, serviceId } = await params;

    const center = await prisma.center.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, centerId: center.id },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if there are active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        serviceId,
        status: { in: ['PENDING', 'CONFIRMED', 'PAID'] },
        diveDate: { gte: new Date() },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service with active bookings' },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
