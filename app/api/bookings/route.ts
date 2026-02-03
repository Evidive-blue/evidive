import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// Validation schema for booking creation
const createBookingSchema = z.object({
  centerId: z.string().min(1),
  serviceId: z.string().min(1),
  diveDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  diveTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  participants: z.number().int().min(1).max(50),
  guestFirstName: z.string().min(1).max(100),
  guestLastName: z.string().min(1).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  specialRequests: z.string().optional(),
  certificationLevel: z.string().optional(),
  extras: z.array(z.object({
    extraId: z.string(),
    quantity: z.number().int().min(1),
  })).optional(),
  couponCode: z.string().optional(),
});

// Generate unique booking reference
function generateReference(): string {
  const prefix = 'EV';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    // Validate input
    const validation = createBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Fetch service with center info
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
      include: {
        center: {
          select: {
            id: true,
            status: true,
            email: true,
            name: true,
          },
        },
        extras: {
          where: { isActive: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.center.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Center is not accepting bookings' }, { status: 400 });
    }

    if (service.centerId !== data.centerId) {
      return NextResponse.json({ error: 'Service does not belong to this center' }, { status: 400 });
    }

    // Validate participants count
    if (data.participants < service.minParticipants || data.participants > service.maxParticipants) {
      return NextResponse.json(
        { error: `Participants must be between ${service.minParticipants} and ${service.maxParticipants}` },
        { status: 400 }
      );
    }

    // Calculate prices
    const unitPrice = Number(service.price);
    const basePrice = service.pricePerPerson ? unitPrice * data.participants : unitPrice;

    // Calculate extras price
    let extrasPrice = 0;
    const bookingExtras: { extraId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

    if (data.extras && data.extras.length > 0) {
      for (const extraData of data.extras) {
        const extra = service.extras.find((e) => e.id === extraData.extraId);
        if (!extra) {
          return NextResponse.json({ error: `Extra ${extraData.extraId} not found` }, { status: 400 });
        }

        const extraUnitPrice = Number(extra.price);
        const extraTotal = extra.multiplyByPax
          ? extraUnitPrice * extraData.quantity * data.participants
          : extraUnitPrice * extraData.quantity;

        extrasPrice += extraTotal;
        bookingExtras.push({
          extraId: extra.id,
          quantity: extraData.quantity,
          unitPrice: extraUnitPrice,
          totalPrice: extraTotal,
        });
      }
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let couponId: string | null = null;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: data.couponCode.toUpperCase(),
          centerId: data.centerId,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (coupon) {
        // Check usage limits
        const usageCount = await prisma.couponUse.count({
          where: { couponId: coupon.id },
        });

        if (!coupon.maxUses || usageCount < coupon.maxUses) {
          if (coupon.discountType === 'PERCENT') {
            discountAmount = ((basePrice + extrasPrice) * Number(coupon.discountValue)) / 100;
            if (coupon.maxDiscount) {
              discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
            }
          } else {
            discountAmount = Number(coupon.discountValue);
          }
          couponId = coupon.id;
        }
      }
    }

    const totalPrice = basePrice + extrasPrice - discountAmount;

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        reference: generateReference(),
        centerId: data.centerId,
        serviceId: data.serviceId,
        diverId: session?.user?.id || null,
        diveDate: new Date(data.diveDate),
        diveTime: new Date(`1970-01-01T${data.diveTime}:00Z`),
        durationMinutes: service.durationMinutes,
        participants: data.participants,
        guestFirstName: data.guestFirstName,
        guestLastName: data.guestLastName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone || null,
        specialRequests: data.specialRequests || null,
        certificationLevel: data.certificationLevel || null,
        unitPrice,
        extrasPrice,
        discountAmount,
        couponCode: data.couponCode?.toUpperCase() || null,
        totalPrice,
        currency: service.currency,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        source: 'website',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
        extras: {
          create: bookingExtras.map((extra) => ({
            extraId: extra.extraId,
            quantity: extra.quantity,
            unitPrice: extra.unitPrice,
            totalPrice: extra.totalPrice,
          })),
        },
      },
      include: {
        service: { select: { name: true } },
        center: { select: { name: true, email: true } },
        extras: { include: { extra: { select: { name: true } } } },
      },
    });

    // Record coupon usage if applied
    if (couponId && discountAmount > 0) {
      await prisma.couponUse.create({
        data: {
          coupon: { connect: { id: couponId } },
          booking: { connect: { id: booking.id } },
          diverId: session?.user?.id || null,
          discountApplied: discountAmount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.reference,
        totalPrice: Number(booking.totalPrice),
        currency: booking.currency,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET bookings for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = {
      OR: [
        { diverId: session.user.id },
        { guestEmail: session.user.email },
      ],
    };

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: { select: { name: true } },
          center: { select: { name: true, slug: true, city: true } },
        },
        orderBy: { diveDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
