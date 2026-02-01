import { z } from "zod";
import { baseAccountSchema, emailSchema, passwordSchema, phoneSchema, fullNameSchema } from "./auth";

// Diver account step schema
export const diverAccountSchema = baseAccountSchema;

export type DiverAccountData = z.infer<typeof diverAccountSchema>;

// Diver preferences step schema
export const diverPreferencesSchema = z.object({
  certificationLevel: z.string().optional(),
  certificationOrg: z.string().optional(),
  totalDives: z.number().min(0).optional(),
  preferredLanguage: z.enum(["fr", "en", "es", "it"]).default("fr"),
});

export type DiverPreferencesData = z.infer<typeof diverPreferencesSchema>;

// Complete diver registration schema
export const diverRegistrationSchema = z.object({
  account: diverAccountSchema,
  preferences: diverPreferencesSchema,
  termsAccepted: z.literal(true, "You must accept the terms and conditions"),
});

export type DiverRegistrationData = z.infer<typeof diverRegistrationSchema>;

// Server-side schema (without confirmPassword)
export const diverCreateSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  certificationLevel: z.string().optional(),
  certificationOrg: z.string().optional(),
  totalDives: z.number().min(0).optional(),
  preferredLanguage: z.enum(["fr", "en", "es", "it"]).default("fr"),
});

export type DiverCreateData = z.infer<typeof diverCreateSchema>;
