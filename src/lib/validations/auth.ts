import { z } from "zod";

// Common reusable validation schemas
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^\+?[1-9]\d{6,14}$/.test(val.replace(/\s/g, "")),
    "Invalid phone number"
  );

export const fullNameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters");

export const firstNameSchema = z
  .string()
  .min(1, "First name is required")
  .max(50, "First name must be less than 50 characters");

export const lastNameSchema = z
  .string()
  .min(1, "Last name is required")
  .max(50, "Last name must be less than 50 characters");

// Base account schema shared across all user types (legacy with fullName)
export const baseAccountSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type BaseAccountData = z.infer<typeof baseAccountSchema>;

// Diver registration schema with firstName/lastName
export const diverRegisterSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type DiverRegisterData = z.infer<typeof diverRegisterSchema>;

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginData = z.infer<typeof loginSchema>;

// Login form schema (client-side, without rememberMe processing)
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

// Reset password schema
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
