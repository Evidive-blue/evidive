import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { stripe, isStripeConfigured } from '@/lib/stripe';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

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
        stripeAccountId: true,
      },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!center.stripeAccountId) {
      return NextResponse.json(
        { error: 'Stripe account not connected' },
        { status: 400 }
      );
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(center.stripeAccountId);

    // Determine status based on account state
    let status: 'PENDING' | 'ACTIVE' | 'RESTRICTED' = 'PENDING';

    if (account.charges_enabled && account.payouts_enabled) {
      status = 'ACTIVE';
    } else if (account.requirements?.currently_due?.length) {
      status = 'RESTRICTED';
    }

    // Update status in database
    await prisma.center.update({
      where: { id: center.id },
      data: { stripeAccountStatus: status },
    });

    return NextResponse.json({
      status,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements,
    });
  } catch (error) {
    console.error('Error refreshing Stripe status:', error);
    return NextResponse.json(
      { error: 'Failed to refresh status' },
      { status: 500 }
    );
  }
}
