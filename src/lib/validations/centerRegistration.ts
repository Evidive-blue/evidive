import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  firstNameSchema,
  lastNameSchema,
  isValidPhone,
} from "./auth";

// Multilingual text schema
export const multilingualTextSchema = z.object({
  fr: z.string().min(1, "Le texte en français est requis"),
  en: z.string().min(1, "Le texte en anglais est requis"),
});

// Step 1 - Personal Info
export const step1PersonalInfoSchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "La confirmation est requise"),
    phone: z.string().min(1, "Le téléphone est requis").refine(
      isValidPhone,
      "Numéro de téléphone invalide"
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type Step1PersonalInfoData = z.infer<typeof step1PersonalInfoSchema>;

// Step 2 - Center Info
export const step2CenterInfoSchema = z.object({
  centerName: z.object({
    fr: z.string().min(2, "Le nom en français doit contenir au moins 2 caractères"),
    en: z.string().min(2, "Le nom en anglais doit contenir au moins 2 caractères"),
  }),
  street: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville est requise"),
  postalCode: z.string().optional(),
  country: z.string().min(2, "Le pays est requis"),
  latitude: z
    .number("Latitude invalide")
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .number("Longitude invalide")
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  shortDescription: z.object({
    fr: z.string().min(20, "La description en français doit contenir au moins 20 caractères"),
    en: z.string().min(20, "La description en anglais doit contenir au moins 20 caractères"),
  }),
});

export type Step2CenterInfoData = z.infer<typeof step2CenterInfoSchema>;

// Step 3 - Legal Info
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

export const step3LegalInfoSchema = z.object({
  companyName: z.string().optional().or(z.literal("")),
  siretOrVat: z.string().optional().or(z.literal("")),
  certifications: z.array(z.enum(certificationTypes)).min(0),
});

export type Step3LegalInfoData = z.infer<typeof step3LegalInfoSchema>;

// Full registration schema for server-side validation
export const centerApplicationSchema = z.object({
  // Personal info
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().min(1),
  // Center info
  centerName: z.object({
    fr: z.string().min(2),
    en: z.string().min(2),
  }),
  street: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  country: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  website: z.string().url().optional().or(z.literal("")),
  shortDescription: z.object({
    fr: z.string().min(20),
    en: z.string().min(20),
  }),
  // Legal info
  companyName: z.string().optional(),
  siretOrVat: z.string().optional(),
  certifications: z.array(z.enum(certificationTypes)),
  // Terms
  termsAccepted: z.literal(true, "Vous devez accepter les CGV"),
});

export type CenterApplicationData = z.infer<typeof centerApplicationSchema>;
