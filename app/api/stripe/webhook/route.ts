import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId || session.client_reference_id;

  if (!bookingId) {
    console.error('No booking ID in checkout session');
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      center: { select: { commissionRate: true } },
    },
  });

  if (!booking) {
    console.error('Booking not found:', bookingId);
    return;
  }

  // Update booking status
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      stripePaymentIntentId: session.payment_intent as string,
      paidAt: new Date(),
      confirmedAt: new Date(),
    },
  });

  // Create commission record
  const commissionRate = Number(booking.center.commissionRate) / 100;
  const commissionAmount = Number(booking.totalPrice) * commissionRate;
  const centerAmount = Number(booking.totalPrice) - commissionAmount;

  await prisma.commission.create({
    data: {
      bookingId: booking.id,
      centerId: booking.centerId,
      bookingAmount: booking.totalPrice,
      commissionRate: booking.center.commissionRate,
      commissionAmount,
      centerAmount,
      status: 'PENDING',
    },
  });

  // Create notification for center owner
  const center = await prisma.center.findUnique({
    where: { id: booking.centerId },
    select: { ownerId: true, name: true },
  });

  if (center) {
    const centerName = typeof center.name === 'object' 
      ? (center.name as Record<string, string>).en || (center.name as Record<string, string>).fr || 'Your center'
      : center.name;

    await prisma.notification.create({
      data: {
        diverId: center.ownerId,
        type: 'BOOKING',
        title: 'New Booking Confirmed',
        message: `New booking ${booking.reference} for ${centerName} has been paid.`,
        bookingId: booking.id,
        centerId: booking.centerId,
      },
    });
  }

  console.log(`Booking ${booking.reference} payment completed`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;

  if (!bookingId) {
    return; // May not be a booking payment
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: 'PAID',
      paidAt: new Date(),
    },
  });

  console.log(`Payment succeeded for booking ${bookingId}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;

  if (!bookingId) {
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancellationReason: 'Payment failed',
      cancelledAt: new Date(),
      cancelledBy: 'CLIENT',
    },
  });

  console.log(`Payment failed for booking ${bookingId}`);
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    return;
  }

  const booking = await prisma.booking.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (!booking) {
    return;
  }

  const refundAmount = charge.amount_refunded / 100;
  const isFullRefund = charge.refunded;

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIAL_REFUND',
      refundedAt: new Date(),
      refundAmount,
    },
  });

  // Update commission status
  await prisma.commission.updateMany({
    where: { bookingId: booking.id },
    data: { status: 'CANCELLED' },
  });

  console.log(`Refund processed for booking ${booking.reference}`);
}
