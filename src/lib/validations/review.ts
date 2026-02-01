import { z } from "zod";

// Review creation schema
export const createReviewSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .min(20, "Comment must be at least 20 characters")
    .max(2000, "Comment must be less than 2000 characters"),
  photos: z
    .array(z.string().url("Invalid photo URL"))
    .max(3, "Maximum 3 photos allowed")
    .optional()
    .default([]),
});

export type CreateReviewData = z.infer<typeof createReviewSchema>;

// Review update schema
export const updateReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .min(20, "Comment must be at least 20 characters")
    .max(2000, "Comment must be less than 2000 characters"),
  photos: z
    .array(z.string().url("Invalid photo URL"))
    .max(3, "Maximum 3 photos allowed")
    .optional()
    .default([]),
});

export type UpdateReviewData = z.infer<typeof updateReviewSchema>;

// Review deletion schema
export const deleteReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
});

export type DeleteReviewData = z.infer<typeof deleteReviewSchema>;
