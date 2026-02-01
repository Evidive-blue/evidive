"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createReviewSchema,
  updateReviewSchema,
  deleteReviewSchema,
} from "@/lib/validations/review";

type ActionResult = {
  success: boolean;
  error?: string;
  reviewId?: string;
};

/**
 * Create a new review for a completed booking
 */
export async function createReview(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const bookingId = formData.get("bookingId") as string;
    const rating = parseInt(formData.get("rating") as string, 10);
    const comment = formData.get("comment") as string;
    const photosRaw = formData.get("photos") as string;
    const photos = photosRaw ? JSON.parse(photosRaw) : [];

    // Validate input
    const parsed = createReviewSchema.safeParse({
      bookingId,
      rating,
      comment,
      photos,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // Check booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        centerId: true,
        status: true,
        diveDate: true,
        review: { select: { id: true } },
        service: { select: { name: true } },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (booking.status !== "COMPLETED") {
      return { success: false, error: "Booking must be completed to leave a review" };
    }

    if (booking.review) {
      return { success: false, error: "Review already exists for this booking" };
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        photos: parsed.data.photos,
        centerId: booking.centerId,
        userId: session.user.id,
        bookingId: booking.id,
        diveDate: booking.diveDate,
        serviceUsed: booking.service?.name
          ? getLocalizedServiceName(booking.service.name)
          : undefined,
        status: "PENDING",
      },
    });

    revalidatePath("/reviews");
    revalidatePath("/dashboard");

    return { success: true, reviewId: review.id };
  } catch (error) {
    console.error("Error creating review:", error);
    return { success: false, error: "Failed to create review" };
  }
}

/**
 * Update an existing review (only if status is PENDING)
 */
export async function updateReview(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const reviewId = formData.get("reviewId") as string;
    const rating = parseInt(formData.get("rating") as string, 10);
    const comment = formData.get("comment") as string;
    const photosRaw = formData.get("photos") as string;
    const photos = photosRaw ? JSON.parse(photosRaw) : [];

    // Validate input
    const parsed = updateReviewSchema.safeParse({
      reviewId,
      rating,
      comment,
      photos,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // Check review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!review) {
      return { success: false, error: "Review not found" };
    }

    if (review.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (review.status !== "PENDING") {
      return { success: false, error: "Only pending reviews can be modified" };
    }

    // Update review
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        photos: parsed.data.photos,
      },
    });

    revalidatePath("/reviews");

    return { success: true, reviewId };
  } catch (error) {
    console.error("Error updating review:", error);
    return { success: false, error: "Failed to update review" };
  }
}

/**
 * Delete a review (only if status is PENDING)
 */
export async function deleteReview(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const reviewId = formData.get("reviewId") as string;

    // Validate input
    const parsed = deleteReviewSchema.safeParse({ reviewId });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // Check review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!review) {
      return { success: false, error: "Review not found" };
    }

    if (review.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (review.status !== "PENDING") {
      return { success: false, error: "Only pending reviews can be deleted" };
    }

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    revalidatePath("/reviews");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { success: false, error: "Failed to delete review" };
  }
}

// Helper to get localized text from JSON field
function getLocalizedServiceName(name: unknown): string | undefined {
  if (!name || typeof name !== "object") return undefined;
  const obj = name as Record<string, unknown>;
  // Try fr, then en, then first available
  if (typeof obj.fr === "string") return obj.fr;
  if (typeof obj.en === "string") return obj.en;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") return obj[key] as string;
  }
  return undefined;
}
