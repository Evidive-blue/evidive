"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations/auth";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export type TokenValidationResult = {
  valid: boolean;
  error?: "invalid" | "expired" | "used";
  email?: string;
};

/**
 * Verify if a password reset token is valid
 */
export async function verifyResetToken(
  token: string
): Promise<TokenValidationResult> {
  if (!token) {
    return { valid: false, error: "invalid" };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { valid: false, error: "invalid" };
  }

  // Check if token was already used
  if (resetToken.usedAt) {
    return { valid: false, error: "used" };
  }

  // Check if token is expired (1h expiration)
  if (new Date() > resetToken.expiresAt) {
    return { valid: false, error: "expired" };
  }

  return { valid: true, email: resetToken.email };
}

/**
 * Reset password using a valid token
 */
export async function resetPassword(
  token: string,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate input
  const parsed = resetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  // Verify token is still valid
  const tokenResult = await verifyResetToken(token);
  if (!tokenResult.valid || !tokenResult.email) {
    return {
      success: false,
      error: tokenResult.error === "expired" ? "token_expired" : "token_invalid",
    };
  }

  const { password } = parsed.data;

  try {
    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update password and invalidate token in a transaction
    await prisma.$transaction([
      // Update user's password
      prisma.profile.update({
        where: { email: tokenResult.email.toLowerCase() },
        data: { passwordHash },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      error: "Failed to reset password",
    };
  }
}
