"use server";

import { prisma } from "@/lib/prisma";

interface VerifyResult {
  success: boolean;
  error?: string;
}

export async function verifyEmailToken(token: string): Promise<VerifyResult> {
  if (!token) {
    return { success: false, error: "token_missing" };
  }

  try {
    // Find the token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, error: "token_invalid" };
    }

    // Check if already used
    if (verificationToken.usedAt) {
      return { success: false, error: "token_already_used" };
    }

    // Check if expired
    if (new Date() > verificationToken.expiresAt) {
      return { success: false, error: "token_expired" };
    }

    // Find and update the user
    const user = await prisma.profile.findUnique({
      where: { email: verificationToken.email.toLowerCase() },
    });

    if (!user) {
      return { success: false, error: "user_not_found" };
    }

    // Update user as verified and mark token as used
    await prisma.$transaction([
      prisma.profile.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("[VERIFY_EMAIL_ERROR]", error);
    return { success: false, error: "internal_error" };
  }
}

export async function resendVerificationEmail(email: string): Promise<VerifyResult> {
  if (!email) {
    return { success: false, error: "email_required" };
  }

  try {
    const normalizedEmail = email.toLowerCase();

    // Find the user
    const user = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return success anyway to prevent email enumeration
      return { success: true };
    }

    if (user.emailVerified) {
      return { success: false, error: "already_verified" };
    }

    // Delete any existing tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Generate new token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt,
      },
    });

    // TODO: Send email with token link
    // For now, log the verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    console.log("[VERIFICATION_EMAIL]", { email: normalizedEmail, verificationUrl });

    return { success: true };
  } catch (error) {
    console.error("[RESEND_VERIFICATION_ERROR]", error);
    return { success: false, error: "internal_error" };
  }
}
