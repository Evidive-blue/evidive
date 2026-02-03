import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateWorkerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().or(z.literal('')).optional().nullable(),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  workingHours: z.record(z.unknown()).optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ slug: string; workerId: string }>;
}

// GET - Get a single worker
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, workerId } = await params;

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

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
    });

    if (!worker || worker.centerId !== center.id) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    return NextResponse.json({ worker });
  } catch (error) {
    console.error('Error fetching worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a worker
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, workerId } = await params;

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

    const existingWorker = await prisma.worker.findUnique({
      where: { id: workerId },
    });

    if (!existingWorker || existingWorker.centerId !== center.id) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = updateWorkerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If setting as default, unset other defaults first
    if (data.isDefault === true) {
      await prisma.worker.updateMany({
        where: { centerId: center.id, isDefault: true, id: { not: workerId } },
        data: { isDefault: false },
      });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.bio !== undefined) updateData.bio = data.bio || null;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl || null;
    if (data.certifications !== undefined) updateData.certifications = data.certifications;
    if (data.languages !== undefined) updateData.languages = data.languages;
    if (data.workingHours !== undefined) updateData.workingHours = data.workingHours;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: updateData,
    });

    return NextResponse.json({ success: true, worker });
  } catch (error) {
    console.error('Error updating worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a worker
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, workerId } = await params;

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

    const existingWorker = await prisma.worker.findUnique({
      where: { id: workerId },
    });

    if (!existingWorker || existingWorker.centerId !== center.id) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Check if worker has bookings
    const bookingsCount = await prisma.booking.count({
      where: { workerId: workerId },
    });

    if (bookingsCount > 0) {
      // Soft delete - just deactivate
      await prisma.worker.update({
        where: { id: workerId },
        data: { isActive: false },
      });
      return NextResponse.json({ 
        success: true, 
        softDeleted: true,
        message: 'Worker deactivated (has existing bookings)' 
      });
    }

    // Hard delete
    await prisma.worker.delete({
      where: { id: workerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
