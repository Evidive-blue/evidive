import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { AdminCenterDetailClient } from './admin-center-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCenterDetailPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const center = await prisma.center.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true,
        },
      },
      services: {
        orderBy: { createdAt: 'desc' },
      },
      bookings: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          service: { select: { name: true } },
          diver: { select: { displayName: true, email: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          diver: { select: { displayName: true, email: true } },
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
  });

  if (!center) {
    notFound();
  }

  // Get revenue stats
  const revenue = await prisma.booking.aggregate({
    where: {
      centerId: id,
      paymentStatus: 'PAID',
    },
    _sum: { totalPrice: true },
  });

  return (
    <AdminCenterDetailClient
      center={center}
      totalRevenue={Number(revenue._sum.totalPrice || 0)}
    />
  );
}
