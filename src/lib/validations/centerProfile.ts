import { z } from "zod";

// Multilingual text schema (5 languages)
export const multilingualSchema = z.object({
  fr: z.string().optional().default(""),
  en: z.string().optional().default(""),
  de: z.string().optional().default(""),
  es: z.string().optional().default(""),
  it: z.string().optional().default(""),
});

export type MultilingualText = z.infer<typeof multilingualSchema>;

// URL validation helper
const urlSchema = z.string().url("URL invalide").optional().or(z.literal(""));

// Phone validation
const phoneSchema = z.string().refine(
  (val) => !val || /^\+?[1-9]\d{6,14}$/.test(val.replace(/\s/g, "")),
  "Numéro de téléphone invalide"
).optional().or(z.literal(""));

// Social URL validation
const socialUrlSchema = z.string().url("URL invalide").optional().or(z.literal(""));

// Opening hours schema
export const dayScheduleSchema = z.object({
  open: z.boolean().default(false),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM").optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM").optional(),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM").optional(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM").optional(),
});

export const openingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

export type OpeningHours = z.infer<typeof openingHoursSchema>;

// Default opening hours
export const defaultOpeningHours: OpeningHours = {
  monday: { open: true, openTime: "08:00", closeTime: "18:00" },
  tuesday: { open: true, openTime: "08:00", closeTime: "18:00" },
  wednesday: { open: true, openTime: "08:00", closeTime: "18:00" },
  thursday: { open: true, openTime: "08:00", closeTime: "18:00" },
  friday: { open: true, openTime: "08:00", closeTime: "18:00" },
  saturday: { open: true, openTime: "08:00", closeTime: "18:00" },
  sunday: { open: false },
};

// Certification types
export const certificationTypes = [
  "PADI",
  "SSI",
  "CMAS",
  "FFESSM",
  "NAUI",
  "SDI",
  "TDI",
  "BSAC",
] as const;

export type CertificationType = (typeof certificationTypes)[number];

// Available languages
export const languageOptions = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ar", label: "العربية" },
] as const;

// ============================================
// Section Schemas
// ============================================

// Section 1: Identity
export const centerIdentitySchema = z.object({
  name: multilingualSchema.refine(
    (val) => !!val.fr?.trim() || !!val.en?.trim(),
    "Le nom est requis en français ou en anglais"
  ),
  logoUrl: z.string().nullable().optional(),
  featuredImage: z.string().nullable().optional(),
  photos: z.array(z.string()).max(10, "Maximum 10 photos").default([]),
});

export type CenterIdentityData = z.infer<typeof centerIdentitySchema>;

// Section 2: Description
export const centerDescriptionSchema = z.object({
  shortDescription: multilingualSchema,
  description: multilingualSchema,
});

export type CenterDescriptionData = z.infer<typeof centerDescriptionSchema>;

// Section 3: Contact
export const centerContactSchema = z.object({
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  street2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "La ville est requise"),
  region: z.string().optional().or(z.literal("")),
  country: z.string().min(2, "Le pays est requis"),
  zip: z.string().optional().or(z.literal("")),
  phone: phoneSchema,
  email: z.string().email("Email invalide"),
  website: urlSchema,
  facebook: socialUrlSchema,
  instagram: socialUrlSchema,
  whatsapp: z.string().optional().or(z.literal("")),
});

export type CenterContactData = z.infer<typeof centerContactSchema>;

// Section 4: Practical Info
export const centerPracticalSchema = z.object({
  openingHours: openingHoursSchema.optional(),
  languagesSpoken: z.array(z.string()).default([]),
  certifications: z.array(z.enum(certificationTypes)).default([]),
  equipmentRental: z.boolean().default(false),
});

export type CenterPracticalData = z.infer<typeof centerPracticalSchema>;

// Section 5: Engagement
export const centerEngagementSchema = z.object({
  ecoCommitment: z.string().max(2000, "Maximum 2000 caractères").optional().or(z.literal("")),
});

export type CenterEngagementData = z.infer<typeof centerEngagementSchema>;

// Section 6: Location
export const centerLocationSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
});

export type CenterLocationData = z.infer<typeof centerLocationSchema>;

// Section 7: Payments
export const paymentTypeOptions = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "paypal", label: "PayPal" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "google_pay", label: "Google Pay" },
] as const;

export type PaymentType = (typeof paymentTypeOptions)[number]["value"];

export const centerPaymentsSchema = z.object({
  paymentTypes: z.array(z.string()).default([]),
});

export type CenterPaymentsData = z.infer<typeof centerPaymentsSchema>;

// ============================================
// Full Profile Schema (for global save)
// ============================================

export const centerProfileSchema = z.object({
  // Identity
  name: multilingualSchema,
  logoUrl: z.string().nullable().optional(),
  featuredImage: z.string().nullable().optional(),
  photos: z.array(z.string()).max(10).default([]),
  
  // Description
  shortDescription: multilingualSchema,
  description: multilingualSchema,
  
  // Contact
  address: z.string().min(5),
  street2: z.string().optional(),
  city: z.string().min(2),
  region: z.string().optional(),
  country: z.string().min(2),
  zip: z.string().optional(),
  phone: phoneSchema,
  email: z.string().email(),
  website: urlSchema,
  facebook: socialUrlSchema,
  instagram: socialUrlSchema,
  whatsapp: z.string().optional(),
  
  // Practical
  openingHours: openingHoursSchema.optional(),
  languagesSpoken: z.array(z.string()).default([]),
  certifications: z.array(z.enum(certificationTypes)).default([]),
  equipmentRental: z.boolean().default(false),
  
  // Engagement
  ecoCommitment: z.string().max(2000).optional(),
  
  // Payments
  paymentTypes: z.array(z.string()).default([]),
  
  // Location
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type CenterProfileData = z.infer<typeof centerProfileSchema>;
