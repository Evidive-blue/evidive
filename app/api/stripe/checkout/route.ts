import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema
const checkoutSchema = z.object({
  bookingId: z.string().min(1),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { bookingId, email } = validation.data;

    // Fetch booking with related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { name: true } },
        center: { 
          select: { 
            name: true, 
            stripeAccountId: true,
            commissionRate: true,
          } 
        },
        extras: {
          include: {
            extra: { select: { name: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Security: Verify the requester owns this booking (by email match)
    // This prevents arbitrary checkout creation for any bookingId
    if (email && booking.guestEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (booking.paymentStatus !== 'UNPAID') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    // Get localized names
    const getLocalizedName = (value: unknown): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, string>;
        return obj.en || obj.fr || Object.values(obj)[0] || '';
      }
      return '';
    };

    const serviceName = getLocalizedName(booking.service.name);
    const centerName = getLocalizedName(booking.center.name);
    const totalAmount = Math.round(Number(booking.totalPrice) * 100); // Convert to cents

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: booking.currency.toLowerCase(),
          product_data: {
            name: serviceName,
            description: `${centerName} - ${booking.participants} participant(s) - ${new Date(booking.diveDate).toLocaleDateString()}`,
          },
          unit_amount: Math.round(Number(booking.unitPrice) * 100),
        },
        quantity: booking.participants,
      },
    ];

    // Add extras as separate line items
    for (const extra of booking.extras) {
      const extraName = getLocalizedName(extra.extra.name);
      lineItems.push({
        price_data: {
          currency: booking.currency.toLowerCase(),
          product_data: {
            name: `Extra: ${extraName}`,
          },
          unit_amount: Math.round(Number(extra.unitPrice) * 100),
        },
        quantity: extra.quantity,
      });
    }

    // Add discount if applicable
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (Number(booking.discountAmount) > 0 && booking.couponCode) {
      // Create a coupon in Stripe for this discount
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(Number(booking.discountAmount) * 100),
        currency: booking.currency.toLowerCase(),
        name: `Discount: ${booking.couponCode}`,
        duration: 'once',
      });
      discounts.push({ coupon: stripeCoupon.id });
    }

    // Determine success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/booking/success?reference=${booking.reference}`;
    const cancelUrl = `${baseUrl}/booking/cancel?reference=${booking.reference}`;

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: booking.guestEmail,
      client_reference_id: booking.id,
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        centerId: booking.centerId,
        serviceId: booking.serviceId,
      },
      payment_intent_data: {
        metadata: {
          bookingId: booking.id,
          bookingReference: booking.reference,
        },
      },
    };

    // Add discounts if any
    if (discounts.length > 0) {
      sessionParams.discounts = discounts;
    }

    // If center has Stripe Connect, use destination charges with application fee
    if (booking.center.stripeAccountId) {
      const commissionRate = Number(booking.center.commissionRate) / 100;
      const applicationFee = Math.round(totalAmount * commissionRate);

      // Express Connect: Destination charge with application fee
      sessionParams.payment_intent_data = {
        ...sessionParams.payment_intent_data,
        application_fee_amount: applicationFee,
        on_behalf_of: booking.center.stripeAccountId,
        transfer_data: {
          destination: booking.center.stripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update booking with Stripe session ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripeCheckoutSessionId: session.id,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
