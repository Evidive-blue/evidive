import { z } from "zod";
import { baseAccountSchema, emailSchema, passwordSchema, phoneSchema, fullNameSchema } from "./auth";

// Seller account step schema
export const sellerAccountSchema = baseAccountSchema;

export type SellerAccountData = z.infer<typeof sellerAccountSchema>;

// Seller profile step schema
export const sellerProfileSchema = z.object({
  bio: z.string().min(10, "Bio must be at least 10 characters").max(1000),
  certifications: z.array(z.string()).min(1, "At least one certification is required"),
  languages: z.array(z.enum(["fr", "en", "es", "it"])).min(1, "At least one language is required"),
  photoUrl: z.string().url().optional(),
});

export type SellerProfileData = z.infer<typeof sellerProfileSchema>;

// Seller service schema
export const sellerServiceSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  price: z.number().min(0, "Price must be positive"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  maxParticipants: z.number().min(1).max(50).default(1),
});

export type SellerServiceData = z.infer<typeof sellerServiceSchema>;

// Seller services step schema (array of services)
export const sellerServicesSchema = z.object({
  services: z.array(sellerServiceSchema).min(1, "At least one service is required"),
});

export type SellerServicesData = z.infer<typeof sellerServicesSchema>;

// Seller payments step schema
export const sellerPaymentsSchema = z.object({
  stripeConnected: z.boolean().default(false),
  stripeAccountId: z.string().optional(),
});

export type SellerPaymentsData = z.infer<typeof sellerPaymentsSchema>;

// Complete seller registration schema
export const sellerRegistrationSchema = z.object({
  account: sellerAccountSchema,
  profile: sellerProfileSchema,
  services: sellerServicesSchema,
  payments: sellerPaymentsSchema.optional(),
  termsAccepted: z.literal(true, "You must accept the terms and conditions"),
});

export type SellerRegistrationData = z.infer<typeof sellerRegistrationSchema>;

// Server-side schema (without confirmPassword)
export const sellerCreateSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  bio: z.string().min(10).max(1000),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  photoUrl: z.string().url().optional(),
});

export type SellerCreateData = z.infer<typeof sellerCreateSchema>;
