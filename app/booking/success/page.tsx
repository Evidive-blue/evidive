import { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/db/prisma';
import { BookingSuccessClient } from './booking-success-client';

export const metadata: Metadata = {
  title: 'Booking Confirmed | EviDive',
  description: 'Your dive booking has been confirmed.',
};

interface Props {
  searchParams: Promise<{ reference?: string }>;
}

async function getBooking(reference: string) {
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: {
      service: { select: { name: true, durationMinutes: true } },
      center: {
        select: {
          name: true,
          slug: true,
          email: true,
          phone: true,
          city: true,
          country: true,
          address: true,
        },
      },
      extras: {
        include: {
          extra: { select: { name: true } },
        },
      },
    },
  });

  if (!booking) return null;

  // Serialize decimals
  return {
    ...booking,
    unitPrice: Number(booking.unitPrice),
    extrasPrice: Number(booking.extrasPrice),
    discountAmount: Number(booking.discountAmount),
    totalPrice: Number(booking.totalPrice),
    depositAmount: Number(booking.depositAmount),
    extras: booking.extras.map((e) => ({
      ...e,
      unitPrice: Number(e.unitPrice),
      totalPrice: Number(e.totalPrice),
    })),
  };
}

export default async function BookingSuccessPage({ searchParams }: Props) {
  const { reference } = await searchParams;

  if (!reference) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 pt-24">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold">Invalid Booking</h1>
          <p className="mt-2 text-white/60">No booking reference provided.</p>
        </div>
      </div>
    );
  }

  const booking = await getBooking(reference);

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 pt-24">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold">Booking Not Found</h1>
          <p className="mt-2 text-white/60">The booking reference is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingSuccessClient booking={booking} />
    </Suspense>
  );
}
