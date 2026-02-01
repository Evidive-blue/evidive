import { z } from "zod";

// Localized JSON schema for multilingual fields
const localizedTextSchema = z.object({
  fr: z.string().min(1, "Le texte en français est requis"),
  en: z.string().optional(),
  es: z.string().optional(),
  it: z.string().optional(),
  de: z.string().optional(),
});

const localizedOptionalTextSchema = z.object({
  fr: z.string().optional(),
  en: z.string().optional(),
  es: z.string().optional(),
  it: z.string().optional(),
  de: z.string().optional(),
});

// Available days enum
export const AVAILABLE_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

// Certification levels
export const CERTIFICATION_LEVELS = [
  "none",
  "ow",
  "aow",
  "rescue",
  "dm",
  "instructor",
] as const;

// Service Extra schema
export const serviceExtraSchema = z.object({
  id: z.string().optional(), // Optional for new extras
  name: localizedTextSchema,
  description: localizedOptionalTextSchema.optional(),
  price: z.number().min(0, "Le prix doit être positif"),
  multiplyByPax: z.boolean().default(false),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type ServiceExtraData = z.infer<typeof serviceExtraSchema>;

// Create Service schema
export const createServiceSchema = z.object({
  name: localizedTextSchema,
  description: localizedOptionalTextSchema.optional(),
  categoryId: z.string().optional().nullable(),
  price: z.number().min(0.01, "Le prix doit être supérieur à 0"),
  currency: z.string().default("EUR"),
  pricePerPerson: z.boolean().default(true),
  durationMinutes: z.number().min(1, "La durée doit être supérieure à 0"),
  minParticipants: z.number().min(1).default(1),
  maxParticipants: z.number().min(1).default(10),
  minCertification: z.string().optional().nullable(),
  minAge: z.number().min(0).default(10),
  maxDepth: z.number().optional().nullable(),
  equipmentIncluded: z.boolean().default(false),
  equipmentDetails: z.string().optional().nullable(),
  includes: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  availableDays: z.array(z.enum(AVAILABLE_DAYS)).default([...AVAILABLE_DAYS]),
  startTimes: z.array(z.string()).default([]),
  extras: z.array(serviceExtraSchema).default([]),
}).refine((data) => data.minParticipants <= data.maxParticipants, {
  message: "Le minimum de participants doit être inférieur ou égal au maximum",
  path: ["minParticipants"],
});

export type CreateServiceData = z.infer<typeof createServiceSchema>;

// Update Service schema (same as create but with ID)
export const updateServiceSchema = createServiceSchema.extend({
  id: z.string(),
});

export type UpdateServiceData = z.infer<typeof updateServiceSchema>;

// Delete/Archive Service schema
export const serviceIdSchema = z.object({
  id: z.string().min(1, "L'ID du service est requis"),
});

export type ServiceIdData = z.infer<typeof serviceIdSchema>;

// Duplicate Service schema
export const duplicateServiceSchema = z.object({
  id: z.string().min(1, "L'ID du service est requis"),
  newName: localizedTextSchema.optional(),
});

export type DuplicateServiceData = z.infer<typeof duplicateServiceSchema>;

// Service Extra CRUD schemas
export const createExtraSchema = z.object({
  serviceId: z.string().min(1, "L'ID du service est requis"),
  name: localizedTextSchema,
  description: localizedOptionalTextSchema.optional(),
  price: z.number().min(0, "Le prix doit être positif"),
  multiplyByPax: z.boolean().default(false),
  isRequired: z.boolean().default(false),
});

export type CreateExtraData = z.infer<typeof createExtraSchema>;

export const updateExtraSchema = createExtraSchema.extend({
  id: z.string().min(1, "L'ID de l'extra est requis"),
});

export type UpdateExtraData = z.infer<typeof updateExtraSchema>;

export const deleteExtraSchema = z.object({
  id: z.string().min(1, "L'ID de l'extra est requis"),
});

export type DeleteExtraData = z.infer<typeof deleteExtraSchema>;
