import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { CalendarManageClient } from './calendar-manage-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Calendar & Availability | EviDive',
  description: 'Manage your dive center schedule and availability',
};

export default async function CalendarPage({ params }: Props) {
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
      openingHours: true,
      bookings: {
        where: {
          diveDate: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
          status: { not: 'CANCELLED' },
        },
        orderBy: { diveDate: 'asc' },
        select: {
          id: true,
          reference: true,
          diveDate: true,
          diveTime: true,
          participants: true,
          status: true,
          service: { select: { name: true } },
          diver: { select: { displayName: true, firstName: true } },
          guestFirstName: true,
        },
      },
      services: {
        where: { isActive: true },
        select: { id: true, name: true, maxParticipants: true },
      },
    },
  });

  if (!center) {
    notFound();
  }

  if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Serialize dates
  const serializedBookings = center.bookings.map((b) => ({
    ...b,
    diveDate: b.diveDate.toISOString(),
    diveTime: b.diveTime.toISOString(),
  }));

  return (
    <CalendarManageClient
      center={{
        id: center.id,
        slug: center.slug,
        name: center.name,
        openingHours: center.openingHours,
      }}
      bookings={serializedBookings}
      services={center.services}
    />
  );
}
