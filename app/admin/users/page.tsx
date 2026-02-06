import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { AdminUsersClient } from "./admin-users-client";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs | Admin EviDive",
  description: "Gérer tous les utilisateurs de la plateforme",
};

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminUsersClient />;
}
