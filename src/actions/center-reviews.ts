"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema for center response
const respondToReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  response: z
    .string()
    .min(10, "Response must be at least 10 characters")
    .max(1000, "Response must be less than 1000 characters"),
});

export type RespondToReviewData = z.infer<typeof respondToReviewSchema>;

/**
 * Verifies that the current user owns the center associated with a review.
 * Returns the review if authorized, null otherwise.
 */
async function getAuthorizedReview(reviewId: string) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // Only CENTER_OWNER and ADMIN can respond to reviews
  if (
    session.user.userType !== "CENTER_OWNER" &&
    session.user.userType !== "ADMIN"
  ) {
    return null;
  }

  // Get the review with center info
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      center: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });

  if (!review) {
    return null;
  }

  // ADMIN can manage any review
  if (session.user.userType === "ADMIN") {
    return review;
  }

  // CENTER_OWNER can only respond to their own center's reviews
  if (review.center.ownerId !== session.user.id) {
    return null;
  }

  return review;
}

/**
 * Respond to a review.
 * Center owners can only respond once per review.
 */
export async function respondToReview(data: RespondToReviewData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate input
    const parsed = respondToReviewSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid data",
      };
    }

    const { reviewId, response } = parsed.data;

    const review = await getAuthorizedReview(reviewId);

    if (!review) {
      return {
        success: false,
        error: "Review not found or unauthorized",
      };
    }

    // Check if review is APPROVED
    if (review.status !== "APPROVED") {
      return {
        success: false,
        error: "Cannot respond to a non-approved review",
      };
    }

    // Check if already responded
    if (review.centerResponse) {
      return {
        success: false,
        error: "You have already responded to this review",
      };
    }

    // Update review with response
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        centerResponse: response,
        centerResponseAt: new Date(),
      },
    });

    // Create notification for the customer
    await prisma.notification.create({
      data: {
        userId: review.userId,
        type: "REVIEW_RESPONSE",
        title: "Réponse à votre avis",
        message: "Le centre a répondu à votre avis.",
        linkUrl: `/reviews`,
        linkText: "Voir la réponse",
        reviewId: review.id,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/center/reviews");

    return { success: true };
  } catch (error) {
    console.error("Error responding to review:", error);
    return {
      success: false,
      error: "An error occurred while responding to the review",
    };
  }
}

/**
 * Get reviews statistics for a center.
 */
export async function getCenterReviewsStats(centerId: string) {
  const [ratingDistribution, totalStats] = await Promise.all([
    // Count reviews by rating (1-5)
    prisma.review.groupBy({
      by: ["rating"],
      where: {
        centerId,
        status: "APPROVED",
      },
      _count: {
        rating: true,
      },
    }),

    // Get total count
    prisma.review.count({
      where: {
        centerId,
        status: "APPROVED",
      },
    }),
  ]);

  // Build distribution object
  const distribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const item of ratingDistribution as { rating: number; _count: { rating: number } }[]) {
    distribution[item.rating] = item._count.rating;
  }

  return {
    distribution,
    totalCount: totalStats,
  };
}
