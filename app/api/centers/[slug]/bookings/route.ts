import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find center and verify ownership
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const serviceId = searchParams.get('serviceId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: Record<string, unknown> = {
      centerId: center.id,
    };

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.diveDate = {};
      if (from) {
        (where.diveDate as Record<string, Date>).gte = new Date(from);
      }
      if (to) {
        (where.diveDate as Record<string, Date>).lte = new Date(to);
      }
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    // Fetch bookings
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: { select: { name: true } },
          diver: { select: { displayName: true, firstName: true, lastName: true, email: true } },
          worker: { select: { name: true } },
          extras: {
            include: {
              extra: { select: { name: true } },
            },
          },
        },
        orderBy: [{ diveDate: 'asc' }, { diveTime: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    // Serialize decimals
    const serializedBookings = bookings.map((booking) => ({
      ...booking,
      unitPrice: Number(booking.unitPrice),
      extrasPrice: Number(booking.extrasPrice),
      discountAmount: Number(booking.discountAmount),
      totalPrice: Number(booking.totalPrice),
      depositAmount: Number(booking.depositAmount),
      refundAmount: booking.refundAmount ? Number(booking.refundAmount) : null,
      extras: booking.extras.map((e) => ({
        ...e,
        unitPrice: Number(e.unitPrice),
        totalPrice: Number(e.totalPrice),
      })),
    }));

    return NextResponse.json({
      bookings: serializedBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching center bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update booking status (confirm, cancel, complete)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await context.params;
    const body = await request.json();
    const { bookingId, action } = body;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find center and verify ownership
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

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.centerId !== center.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Handle actions
    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'confirm':
        if (booking.status !== 'PENDING') {
          return NextResponse.json({ error: 'Can only confirm pending bookings' }, { status: 400 });
        }
        updateData = {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        };
        break;

      case 'complete':
        if (!['CONFIRMED', 'PAID', 'RUNNING'].includes(booking.status)) {
          return NextResponse.json({ error: 'Cannot complete this booking' }, { status: 400 });
        }
        updateData = {
          status: 'COMPLETED',
          completedAt: new Date(),
        };
        break;

      case 'cancel':
        if (['COMPLETED', 'CANCELLED', 'REMOVED'].includes(booking.status)) {
          return NextResponse.json({ error: 'Cannot cancel this booking' }, { status: 400 });
        }
        updateData = {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'CENTER',
          cancellationReason: body.reason || 'Cancelled by center',
        };
        break;

      case 'noshow':
        if (!['CONFIRMED', 'PAID'].includes(booking.status)) {
          return NextResponse.json({ error: 'Cannot mark as no-show' }, { status: 400 });
        }
        updateData = {
          status: 'NOSHOW',
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      booking: {
        ...updatedBooking,
        totalPrice: Number(updatedBooking.totalPrice),
      },
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
