import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]),
  description: z.string().optional(),
});

// GET - Get all settings
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update or create a setting
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = updateSettingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { key, value, description } = validationResult.data;

    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value: value as any,
        description: description || undefined,
      },
      create: {
        key,
        value: value as any,
        description: description || undefined,
      },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
