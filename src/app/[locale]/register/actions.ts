"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { diverRegisterSchema } from "@/lib/validations/auth";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/mailer";
import { randomBytes } from "crypto";

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5;

// Token expiration: 24 hours
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000;

function getRateLimitKey(ip: string): string {
  return `register:${ip}`;
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - entry.count };
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export type RegisterActionResult = {
  success: boolean;
  error?: string;
  errorCode?: "RATE_LIMIT" | "EMAIL_EXISTS" | "BLACKLISTED" | "VALIDATION" | "SERVER_ERROR";
};

async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string,
  locale: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/${locale}/verify-email?token=${token}`;

  const subject = locale === "fr" 
    ? "Vérifiez votre adresse email - EviDive"
    : locale === "de"
    ? "Bestätigen Sie Ihre E-Mail-Adresse - EviDive"
    : locale === "es"
    ? "Verifica tu dirección de email - EviDive"
    : locale === "it"
    ? "Verifica il tuo indirizzo email - EviDive"
    : "Verify your email address - EviDive";

  const greeting = locale === "fr"
    ? `Bonjour ${firstName},`
    : locale === "de"
    ? `Hallo ${firstName},`
    : locale === "es"
    ? `Hola ${firstName},`
    : locale === "it"
    ? `Ciao ${firstName},`
    : `Hello ${firstName},`;

  const message = locale === "fr"
    ? "Merci de vous être inscrit sur EviDive ! Cliquez sur le bouton ci-dessous pour vérifier votre adresse email."
    : locale === "de"
    ? "Vielen Dank für Ihre Registrierung bei EviDive! Klicken Sie auf die Schaltfläche unten, um Ihre E-Mail-Adresse zu bestätigen."
    : locale === "es"
    ? "¡Gracias por registrarte en EviDive! Haz clic en el botón de abajo para verificar tu dirección de email."
    : locale === "it"
    ? "Grazie per esserti registrato su EviDive! Clicca sul pulsante qui sotto per verificare il tuo indirizzo email."
    : "Thank you for signing up with EviDive! Click the button below to verify your email address.";

  const buttonText = locale === "fr"
    ? "Vérifier mon email"
    : locale === "de"
    ? "E-Mail bestätigen"
    : locale === "es"
    ? "Verificar mi email"
    : locale === "it"
    ? "Verifica la mia email"
    : "Verify my email";

  const expiryNote = locale === "fr"
    ? "Ce lien expire dans 24 heures."
    : locale === "de"
    ? "Dieser Link läuft in 24 Stunden ab."
    : locale === "es"
    ? "Este enlace caduca en 24 horas."
    : locale === "it"
    ? "Questo link scade tra 24 ore."
    : "This link expires in 24 hours.";

  const ignoreNote = locale === "fr"
    ? "Si vous n'avez pas créé de compte sur EviDive, vous pouvez ignorer cet email."
    : locale === "de"
    ? "Wenn Sie kein Konto bei EviDive erstellt haben, können Sie diese E-Mail ignorieren."
    : locale === "es"
    ? "Si no has creado una cuenta en EviDive, puedes ignorar este email."
    : locale === "it"
    ? "Se non hai creato un account su EviDive, puoi ignorare questa email."
    : "If you did not create an account with EviDive, you can ignore this email.";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${baseUrl}/evidive-logo.png" alt="EviDive" style="height: 50px; width: auto;" />
      </div>
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 40px; text-align: center;">
        <h1 style="color: #22d3ee; margin: 0 0 20px; font-size: 24px;">${greeting}</h1>
        <p style="color: #e2e8f0; margin: 0 0 30px; font-size: 16px;">${message}</p>
        
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(6, 182, 212, 0.3);">
          ${buttonText}
        </a>
        
        <p style="color: #94a3b8; margin: 30px 0 0; font-size: 14px;">${expiryNote}</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">${ignoreNote}</p>
        <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0;">
          &copy; ${new Date().getFullYear()} EviDive. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
${greeting}

${message}

${buttonText}: ${verificationUrl}

${expiryNote}

${ignoreNote}

© ${new Date().getFullYear()} EviDive
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
    template: "email-verification",
    metadata: { firstName, locale },
  });
}

export async function createDiverAccount(
  locale: string,
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }
): Promise<RegisterActionResult> {
  // Get client IP for rate limiting
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0] ?? "127.0.0.1";

  // Check rate limit
  const rateLimitResult = checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: "Too many registration attempts. Please try again later.",
      errorCode: "RATE_LIMIT",
    };
  }

  // Validate input
  const parsed = diverRegisterSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message || "Validation failed",
      errorCode: "VALIDATION",
    };
  }

  const { firstName, lastName, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if email already exists
    const existingUser = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isBlacklisted: true },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account already exists with this email",
        errorCode: "EMAIL_EXISTS",
      };
    }

    // Check if email is in a blacklist (check for previously blacklisted emails)
    // This checks if there's any record with this email that was blacklisted
    const blacklistedCheck = await prisma.profile.findFirst({
      where: {
        email: normalizedEmail,
        isBlacklisted: true,
      },
    });

    if (blacklistedCheck) {
      return {
        success: false,
        error: "This email cannot be used for registration",
        errorCode: "BLACKLISTED",
      };
    }

    // Hash password with bcrypt (cost 12)
    const passwordHash = await hashPassword(password);

    // Create profile
    const displayName = `${firstName} ${lastName}`.trim();
    const profile = await prisma.profile.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName,
        lastName,
        displayName,
        userType: "DIVER",
        preferredLanguage: locale,
        emailVerified: false,
        isActive: true,
        isBlacklisted: false,
      },
    });

    // Generate verification token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);

    // Delete any existing verification tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Store verification token
    await prisma.emailVerificationToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, firstName, token, locale);
    } catch (emailError) {
      // Log but don't fail registration if email fails
      console.error("Failed to send verification email:", emailError);
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating diver account:", error);
    return {
      success: false,
      error: "An error occurred during registration. Please try again.",
      errorCode: "SERVER_ERROR",
    };
  }
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const existingUser = await prisma.profile.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  return !existingUser;
}
