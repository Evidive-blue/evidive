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
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      shortDescription: true,
      address: true,
      city: true,
      region: true,
      country: true,
      email: true,
      phone: true,
      website: true,
      certifications: true,
      languagesSpoken: true,
      status: true,
      verified: true,
      rating: true,
      reviewCount: true,
      bookingCount: true,
      viewCount: true,
      createdAt: true,
      approvedAt: true,
      commissionRate: true,
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

  // Serialize Decimal fields for Client Component
  const serializedCenter = {
    ...center,
    rating: Number(center.rating),
    commissionRate: Number(center.commissionRate),
    services: center.services.map((service) => ({
      ...service,
      price: Number(service.price),
    })),
    bookings: center.bookings.map((booking) => ({
      ...booking,
      unitPrice: Number(booking.unitPrice),
      extrasPrice: Number(booking.extrasPrice),
      discountAmount: Number(booking.discountAmount),
      totalPrice: Number(booking.totalPrice),
      depositAmount: Number(booking.depositAmount),
      refundAmount: booking.refundAmount ? Number(booking.refundAmount) : null,
    })),
  };

  return (
    <AdminCenterDetailClient
      center={serializedCenter as any}
      totalRevenue={Number(revenue._sum.totalPrice || 0)}
    />
  );
}
