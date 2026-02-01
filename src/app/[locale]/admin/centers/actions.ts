"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function assertAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized.");
  }
  if (session.user.userType !== "ADMIN") {
    throw new Error("Unauthorized.");
  }
}

export async function approveCenter(formData: FormData): Promise<void> {
  const centerId = formData.get("centerId");
  const locale = formData.get("locale");

  await assertAdmin();
  if (typeof centerId !== "string" || centerId.length === 0) {
    throw new Error("Missing centerId.");
  }
  if (typeof locale !== "string" || locale.length === 0) {
    throw new Error("Missing locale.");
  }

  await prisma.diveCenter.update({
    where: { id: centerId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      verified: true,
    },
  });

  revalidatePath("/"); // conservative
  revalidatePath(`/${locale}/centers`);
}

export async function rejectCenter(formData: FormData): Promise<void> {
  const centerId = formData.get("centerId");
  const locale = formData.get("locale");

  await assertAdmin();
  if (typeof centerId !== "string" || centerId.length === 0) {
    throw new Error("Missing centerId.");
  }
  if (typeof locale !== "string" || locale.length === 0) {
    throw new Error("Missing locale.");
  }

  await prisma.diveCenter.update({
    where: { id: centerId },
    data: {
      status: "REJECTED",
      approvedAt: null,
      verified: false,
    },
  });

  revalidatePath(`/${locale}/centers`);
}

