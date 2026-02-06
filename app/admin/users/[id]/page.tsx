import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { AdminUserDetailClient } from "./admin-user-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.diver.findUnique({
    where: { id },
    select: { displayName: true, email: true },
  });

  return {
    title: user ? `${user.displayName || user.email} | Admin EviDive` : "Utilisateur | Admin EviDive",
    description: "Détails de l'utilisateur",
  };
}

export default async function AdminUserDetailPage({ params }: Props) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const user = await prisma.diver.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      phone: true,
      address: true,
      city: true,
      zip: true,
      country: true,
      role: true,
      certificationLevel: true,
      certificationOrg: true,
      totalDives: true,
      preferredLanguage: true,
      emailNotifications: true,
      smsNotifications: true,
      emailVerified: true,
      emailVerifiedAt: true,
      isActive: true,
      isBlacklisted: true,
      createdAt: true,
      updatedAt: true,
      centers: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          city: true,
          country: true,
        },
      },
      bookings: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          totalPrice: true,
          status: true,
          diveDate: true,
          center: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          center: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          centers: true,
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Serialize Decimal fields to numbers for client component
  const serializedUser = {
    ...user,
    bookings: user.bookings.map((booking) => ({
      ...booking,
      totalPrice: Number(booking.totalPrice),
    })),
  };

  return <AdminUserDetailClient initialUser={serializedUser} />;
}
