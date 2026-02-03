import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.record(z.string()),
  description: z.record(z.string()).nullable().optional(),
  price: z.number().positive(),
  currency: z.string().default('EUR'),
  durationMinutes: z.number().int().positive(),
  minParticipants: z.number().int().positive().default(1),
  maxParticipants: z.number().int().positive().default(10),
  minCertification: z.string().nullable().optional(),
  minAge: z.number().int().min(8).default(10),
  maxDepth: z.number().int().nullable().optional(),
  equipmentIncluded: z.boolean().default(false),
  equipmentDetails: z.string().nullable().optional(),
  availableDays: z.array(z.string()).default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTimes: z.array(z.string()).default([]),
});

// GET /api/centers/[slug]/services - List services for a center
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const center = await prisma.center.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    const services = await prisma.service.findMany({
      where: { centerId: center.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/centers/[slug]/services - Create a new service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Find center and verify ownership
    const center = await prisma.center.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    // Check ownership (owner or admin)
    if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = serviceSchema.parse(body);

    const service = await prisma.service.create({
      data: {
        centerId: center.id,
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        currency: data.currency,
        durationMinutes: data.durationMinutes,
        minParticipants: data.minParticipants,
        maxParticipants: data.maxParticipants,
        minCertification: data.minCertification,
        minAge: data.minAge,
        maxDepth: data.maxDepth,
        equipmentIncluded: data.equipmentIncluded,
        equipmentDetails: data.equipmentDetails,
        availableDays: data.availableDays,
        startTimes: data.startTimes,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
