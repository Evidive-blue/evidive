import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { CenterManageClient } from './center-manage-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CenterManagePage({ params }: Props) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  const center = await prisma.center.findUnique({
    where: { slug },
    include: {
      services: {
        orderBy: { createdAt: 'desc' },
      },
      workers: {
        orderBy: { isDefault: 'desc' },
      },
      bookings: {
        where: {
          diveDate: { gte: new Date() },
          status: { notIn: ['CANCELLED', 'REMOVED'] },
        },
        orderBy: { diveDate: 'asc' },
        take: 10,
        include: {
          service: { select: { name: true } },
          diver: { select: { displayName: true, firstName: true, email: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          diver: { select: { displayName: true, firstName: true } },
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
          services: true,
        },
      },
    },
    // Also fetch mapIcon for the settings
  });

  if (!center) {
    notFound();
  }

  // Check ownership (owner or admin)
  if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get stats for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentBookingsCount, recentRevenue] = await Promise.all([
    prisma.booking.count({
      where: {
        centerId: center.id,
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ['CANCELLED', 'REMOVED'] },
      },
    }),
    prisma.booking.aggregate({
      where: {
        centerId: center.id,
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: 'PAID',
      },
      _sum: { totalPrice: true },
    }),
  ]);

  const stats = {
    totalBookings: center._count.bookings,
    totalReviews: center._count.reviews,
    totalServices: center._count.services,
    recentBookings: recentBookingsCount,
    recentRevenue: Number(recentRevenue._sum.totalPrice || 0),
    rating: Number(center.rating),
  };

  // Convert Decimal fields to numbers for Client Component
  const serializedCenter = {
    ...center,
    latitude: Number(center.latitude),
    longitude: Number(center.longitude),
    rating: Number(center.rating),
    commissionRate: Number(center.commissionRate),
    partialRefundPercent: center.partialRefundPercent ? Number(center.partialRefundPercent) : null,
    services: center.services.map(service => ({
      ...service,
      price: Number(service.price),
      minParticipants: Number(service.minParticipants),
      maxParticipants: Number(service.maxParticipants),
    })),
    bookings: center.bookings.map(booking => ({
      ...booking,
      totalPrice: Number(booking.totalPrice),
    })),
  };

  return <CenterManageClient center={serializedCenter} stats={stats} />;
}
