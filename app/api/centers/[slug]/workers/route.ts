import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createWorkerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET - Get all workers for a center
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const center = await prisma.center.findUnique({
      where: { slug },
      select: {
        id: true,
        ownerId: true,
        workers: {
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        },
      },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ workers: center.workers });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new worker
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

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

    const body = await request.json();
    const validationResult = createWorkerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await prisma.worker.updateMany({
        where: { centerId: center.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const worker = await prisma.worker.create({
      data: {
        centerId: center.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        bio: data.bio || null,
        certifications: data.certifications,
        languages: data.languages,
        isDefault: data.isDefault,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ success: true, worker }, { status: 201 });
  } catch (error) {
    console.error('Error creating worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
