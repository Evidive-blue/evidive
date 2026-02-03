import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { PaymentsManageClient } from './payments-manage-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Payments & Stripe | EviDive',
  description: 'Manage your Stripe account and payment settings',
};

export default async function PaymentsPage({ params }: Props) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const { slug } = await params;

  const center = await prisma.center.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      name: true,
      stripeAccountId: true,
      currency: true,
      bookings: {
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
        select: {
          totalPrice: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          bookings: {
            where: { paymentStatus: 'PAID' },
          },
        },
      },
    },
  });

  if (!center) {
    notFound();
  }

  if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Calculate stats
  const totalRevenue = center.bookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);
  const totalPaidBookings = center._count.bookings;

  return (
    <PaymentsManageClient
      center={{
        id: center.id,
        slug: center.slug,
        name: center.name,
        stripeAccountId: center.stripeAccountId,
        currency: center.currency,
      }}
      stats={{
        totalRevenue,
        totalPaidBookings,
        recentBookings: center.bookings.length,
      }}
    />
  );
}
