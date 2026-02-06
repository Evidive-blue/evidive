import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { AdminBookingDetailClient } from "./admin-booking-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Réservation ${id.slice(0, 8)}... | Admin EviDive`,
    description: "Détails de la réservation",
  };
}

export default async function AdminBookingDetailPage({ params }: Props) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      diver: {
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          phone: true,
        },
      },
      center: {
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          country: true,
          ownerId: true,
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      },
      couponUses: {
        select: {
          discountApplied: true,
          coupon: {
            select: {
              code: true,
              discountType: true,
              discountValue: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  // Serialize Decimal fields to numbers for client component
  const serializedBooking = {
    ...booking,
    unitPrice: Number(booking.unitPrice),
    extrasPrice: Number(booking.extrasPrice),
    discountAmount: Number(booking.discountAmount),
    totalPrice: Number(booking.totalPrice),
    depositAmount: Number(booking.depositAmount),
    refundAmount: booking.refundAmount ? Number(booking.refundAmount) : null,
    service: booking.service
      ? {
          ...booking.service,
          price: Number(booking.service.price),
        }
      : null,
    couponUses: booking.couponUses.map((cu) => ({
      discountApplied: Number(cu.discountApplied),
      coupon: {
        ...cu.coupon,
        discountValue: Number(cu.coupon.discountValue),
      },
    })),
  };

  return <AdminBookingDetailClient initialBooking={serializedBooking} />;
}
