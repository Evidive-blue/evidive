import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { AdminBookingsClient } from "./admin-bookings-client";

export const metadata: Metadata = {
  title: "Gestion des réservations | Admin EviDive",
  description: "Gérer toutes les réservations de la plateforme",
};

export default async function AdminBookingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminBookingsClient />;
}
