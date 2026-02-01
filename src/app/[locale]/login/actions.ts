"use server";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { UserType } from "@prisma/client";

export interface LoginResult {
  ok: boolean;
  error?: string;
  redirectUrl?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

/**
 * Get redirect URL based on user type
 */
function getRedirectUrl(userType: UserType, locale: string): string {
  switch (userType) {
    case "ADMIN":
      return `/${locale}/admin`;
    case "CENTER_OWNER":
      return `/${locale}/center`;
    case "SELLER":
      return `/${locale}/seller`;
    case "DIVER":
    default:
      return `/${locale}/app`;
  }
}

/**
 * Log login attempt for security monitoring
 */
async function logLoginAttempt(
  email: string,
  success: boolean,
  ip: string,
  userAgent: string,
  reason?: string
): Promise<void> {
  // In production, you'd want to store this in a database table
  // For now, we log to console (could be sent to a logging service)
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    email: email.substring(0, 3) + "***", // Partially mask email
    success,
    ip,
    userAgent: userAgent.substring(0, 50),
    reason,
  };
  
  if (!success) {
    console.warn("[LOGIN_ATTEMPT_FAILED]", JSON.stringify(logEntry));
  } else {
    console.info("[LOGIN_ATTEMPT_SUCCESS]", JSON.stringify(logEntry));
  }
}

/**
 * Server action for login with rate limiting and logging
 */
export async function loginAction(
  formData: FormData,
  locale: string
): Promise<LoginResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? 
             headersList.get("x-real-ip") ?? 
             "unknown";
  const userAgent = headersList.get("user-agent") ?? "unknown";
  
  // Parse form data
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "true",
  };
  
  // Validate input
  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_credentials", // Generic message for security
    };
  }
  
  const { email, password, rememberMe } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  
  // Check rate limit by email
  const rateLimit = checkRateLimit(normalizedEmail);
  if (rateLimit.blocked) {
    const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
    
    await logLoginAttempt(normalizedEmail, false, ip, userAgent, "rate_limited");
    
    return {
      ok: false,
      error: "too_many_attempts",
      rateLimited: true,
      retryAfter,
    };
  }
  
  try {
    // Attempt sign in via Auth.js
    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });
    
    // Auth.js signIn returns an error string on failure
    if (result && typeof result === "object" && "error" in result) {
      await logLoginAttempt(normalizedEmail, false, ip, userAgent, "invalid_credentials");
      
      return {
        ok: false,
        error: "invalid_credentials",
      };
    }
    
    // Success - reset rate limit
    resetRateLimit(normalizedEmail);
    
    // Get user type for redirect
    const user = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
      select: { userType: true },
    });
    
    await logLoginAttempt(normalizedEmail, true, ip, userAgent);
    
    const redirectUrl = getRedirectUrl(user?.userType ?? "DIVER", locale);
    
    // Note: rememberMe could be used to set longer session duration
    // This would require modifying the Auth.js session configuration dynamically
    // For now, the session duration is handled by Auth.js config (30 days default)
    
    return {
      ok: true,
      redirectUrl,
    };
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    
    await logLoginAttempt(normalizedEmail, false, ip, userAgent, "server_error");
    
    return {
      ok: false,
      error: "server_error",
    };
  }
}
