"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordResult = {
  success: boolean;
  error?: string;
};

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

/**
 * Check rate limit for password reset requests
 * Max 3 requests per email per hour
 */
async function checkRateLimit(email: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recentRequests = await prisma.passwordResetToken.count({
    where: {
      email: email.toLowerCase(),
      createdAt: {
        gte: windowStart,
      },
    },
  });

  return recentRequests < MAX_REQUESTS_PER_WINDOW;
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Build the password reset email HTML
 */
function buildResetEmailHtml(
  resetLink: string,
  locale: string
): string {
  const texts = {
    fr: {
      title: "Réinitialisation de votre mot de passe",
      greeting: "Bonjour,",
      intro: "Vous avez demandé la réinitialisation de votre mot de passe EviDive.",
      action: "Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :",
      button: "Réinitialiser mon mot de passe",
      expiry: "Ce lien expire dans 1 heure.",
      ignore: "Si vous n'avez pas fait cette demande, ignorez simplement cet email.",
      footer: "L'équipe EviDive",
    },
    en: {
      title: "Reset your password",
      greeting: "Hello,",
      intro: "You have requested to reset your EviDive password.",
      action: "Click the button below to choose a new password:",
      button: "Reset my password",
      expiry: "This link expires in 1 hour.",
      ignore: "If you didn't request this, simply ignore this email.",
      footer: "The EviDive team",
    },
    de: {
      title: "Setzen Sie Ihr Passwort zurück",
      greeting: "Hallo,",
      intro: "Sie haben die Zurücksetzung Ihres EviDive-Passworts angefordert.",
      action: "Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu wählen:",
      button: "Mein Passwort zurücksetzen",
      expiry: "Dieser Link läuft in 1 Stunde ab.",
      ignore: "Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail einfach.",
      footer: "Das EviDive-Team",
    },
  };

  const t = texts[locale as keyof typeof texts] || texts.en;

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a14; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a14;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 600px; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">${t.title}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">${t.greeting}</p>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">${t.intro}</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">${t.action}</p>
            </td>
          </tr>
          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 24px 40px; text-align: center;">
              <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 24px rgba(6, 182, 212, 0.3);">${t.button}</a>
            </td>
          </tr>
          <!-- Expiry notice -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">${t.expiry}</p>
            </td>
          </tr>
          <!-- Ignore notice -->
          <tr>
            <td style="padding: 0 40px 40px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b;">${t.ignore}</p>
              <p style="margin: 16px 0 0 0; font-size: 14px; color: #64748b;">${t.footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Build the password reset email plain text
 */
function buildResetEmailText(
  resetLink: string,
  locale: string
): string {
  const texts = {
    fr: {
      title: "Réinitialisation de votre mot de passe",
      intro: "Vous avez demandé la réinitialisation de votre mot de passe EviDive.",
      link: "Cliquez sur ce lien pour réinitialiser votre mot de passe :",
      expiry: "Ce lien expire dans 1 heure.",
      ignore: "Si vous n'avez pas fait cette demande, ignorez simplement cet email.",
      footer: "L'équipe EviDive",
    },
    en: {
      title: "Reset your password",
      intro: "You have requested to reset your EviDive password.",
      link: "Click this link to reset your password:",
      expiry: "This link expires in 1 hour.",
      ignore: "If you didn't request this, simply ignore this email.",
      footer: "The EviDive team",
    },
    de: {
      title: "Setzen Sie Ihr Passwort zurück",
      intro: "Sie haben die Zurücksetzung Ihres EviDive-Passworts angefordert.",
      link: "Klicken Sie auf diesen Link, um Ihr Passwort zurückzusetzen:",
      expiry: "Dieser Link läuft in 1 Stunde ab.",
      ignore: "Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail einfach.",
      footer: "Das EviDive-Team",
    },
  };

  const t = texts[locale as keyof typeof texts] || texts.en;

  return `
${t.title}

${t.intro}

${t.link}
${resetLink}

${t.expiry}

${t.ignore}

${t.footer}
  `.trim();
}

/**
 * Request a password reset
 * Always returns success to prevent email enumeration attacks
 */
export async function requestPasswordReset(
  locale: string,
  formData: FormData
): Promise<ForgotPasswordResult> {
  const rawData = {
    email: formData.get("email") as string,
  };

  // Validate email format
  const parsed = forgotPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    // Still return success to prevent enumeration
    return { success: true };
  }

  const email = parsed.data.email.toLowerCase();

  // Check rate limit
  const withinLimit = await checkRateLimit(email);
  if (!withinLimit) {
    // Still return success to prevent enumeration
    // But don't send another email
    return { success: true };
  }

  // Check if user exists
  const user = await prisma.profile.findUnique({
    where: { email },
    select: { id: true, displayName: true, preferredLanguage: true },
  });

  // If user doesn't exist, still return success (prevents email enumeration)
  if (!user) {
    return { success: true };
  }

  // Generate token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save token
  await prisma.passwordResetToken.create({
    data: {
      token,
      email,
      expiresAt,
    },
  });

  // Build reset link
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const userLocale = user.preferredLanguage || locale;
  const resetLink = `${baseUrl}/${userLocale}/reset-password?token=${token}`;

  // Build email content
  const emailSubjects = {
    fr: "Réinitialisation de votre mot de passe EviDive",
    en: "Reset your EviDive password",
    de: "Setzen Sie Ihr EviDive-Passwort zurück",
  };

  const subject = emailSubjects[userLocale as keyof typeof emailSubjects] || emailSubjects.en;

  // Send email
  try {
    await sendEmail({
      to: email,
      subject,
      html: buildResetEmailHtml(resetLink, userLocale),
      text: buildResetEmailText(resetLink, userLocale),
      template: "password_reset",
      userId: user.id,
      metadata: {
        resetLink,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    // Log error but don't expose to user
    console.error("Failed to send password reset email:", error);
  }

  return { success: true };
}
