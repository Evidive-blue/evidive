import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const VALID_ICONS = ['diver', 'mask', 'fins', 'tank', 'anchor', 'wave'];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const center = await prisma.center.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    // Check ownership
    if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { mapIcon } = body;

    if (!mapIcon || !VALID_ICONS.includes(mapIcon)) {
      return NextResponse.json({ error: 'Invalid icon' }, { status: 400 });
    }

    await prisma.center.update({
      where: { id: center.id },
      data: { mapIcon },
    });

    return NextResponse.json({ success: true, mapIcon });
  } catch (error) {
    console.error('Error updating center icon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
