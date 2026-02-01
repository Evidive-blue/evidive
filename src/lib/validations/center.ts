import { z } from "zod";
import { baseAccountSchema, emailSchema, passwordSchema, phoneSchema, fullNameSchema } from "./auth";

// Center owner account step schema
export const centerAccountSchema = baseAccountSchema;

export type CenterAccountData = z.infer<typeof centerAccountSchema>;

// Center info step schema
export const centerInfoSchema = z.object({
  centerName: z.string().min(2, "Center name must be at least 2 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  phone: z.string().optional(),
});

export type CenterInfoData = z.infer<typeof centerInfoSchema>;

// Center location step schema
export const centerLocationSchema = z.object({
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type CenterLocationData = z.infer<typeof centerLocationSchema>;

// Center document schema
export const centerDocumentSchema = z.object({
  type: z.enum(["business_license", "insurance", "certification", "other"]),
  fileName: z.string(),
  fileUrl: z.string().url(),
  uploadedAt: z.date().optional(),
});

export type CenterDocumentData = z.infer<typeof centerDocumentSchema>;

// Center documents step schema
export const centerDocumentsSchema = z.object({
  documents: z.array(centerDocumentSchema).optional(),
});

export type CenterDocumentsData = z.infer<typeof centerDocumentsSchema>;

// Center payments step schema
export const centerPaymentsSchema = z.object({
  stripeConnected: z.boolean().default(false),
  stripeAccountId: z.string().optional(),
});

export type CenterPaymentsData = z.infer<typeof centerPaymentsSchema>;

// Complete center registration schema
export const centerRegistrationSchema = z.object({
  account: centerAccountSchema,
  info: centerInfoSchema,
  location: centerLocationSchema,
  documents: centerDocumentsSchema.optional(),
  payments: centerPaymentsSchema.optional(),
  termsAccepted: z.literal(true, "You must accept the terms and conditions"),
});

export type CenterRegistrationData = z.infer<typeof centerRegistrationSchema>;

// Server-side schema (without confirmPassword)
export const centerCreateSchema = z.object({
  // Owner info
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  // Center info
  centerName: z.string().min(2).max(100),
  description: z.string().min(20).max(2000),
  website: z.string().url().optional().or(z.literal("")),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  centerPhone: z.string().optional(),
  // Location
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  country: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
});

export type CenterCreateData = z.infer<typeof centerCreateSchema>;
