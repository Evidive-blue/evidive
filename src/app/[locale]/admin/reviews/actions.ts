"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function approveReview(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.userType !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const reviewId = formData.get("reviewId") as string;
  const locale = formData.get("locale") as string;

  if (!reviewId) {
    throw new Error("Missing reviewId");
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: "APPROVED" },
  });

  // Update center's rating and review count
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { centerId: true },
  });

  if (review?.centerId) {
    const stats = await prisma.review.aggregate({
      where: {
        centerId: review.centerId,
        status: "APPROVED",
      },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.diveCenter.update({
      where: { id: review.centerId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.id,
      },
    });
  }

  revalidatePath(`/${locale}/admin/reviews`);
  revalidatePath(`/${locale}/admin`);
}

export async function rejectReview(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.userType !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const reviewId = formData.get("reviewId") as string;
  const locale = formData.get("locale") as string;

  if (!reviewId) {
    throw new Error("Missing reviewId");
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: "REJECTED" },
  });

  revalidatePath(`/${locale}/admin/reviews`);
  revalidatePath(`/${locale}/admin`);
}
