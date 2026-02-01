"use server";

import { prisma } from "@/lib/prisma";
import { auth, hashPassword, signIn } from "@/lib/auth";
import { diverAccountSchema, diverPreferencesSchema } from "@/lib/validations/diver";

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function createDiverAccount(
  locale: string,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate
  const parsed = diverAccountSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  const { fullName, email, phone, password } = parsed.data;

  // Check if email already exists
  const existingUser = await prisma.profile.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return {
      success: false,
      error: "Email already registered",
    };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  try {
    const user = await prisma.profile.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: fullName,
        phone: phone || null,
        userType: "DIVER",
        preferredLanguage: locale,
      },
    });

    return {
      success: true,
      data: { userId: user.id },
    };
  } catch (error) {
    console.error("Error creating diver account:", error);
    return {
      success: false,
      error: "Failed to create account",
    };
  }
}

export async function updateDiverPreferences(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    certificationLevel: formData.get("certificationLevel") as string,
    certificationOrg: formData.get("certificationOrg") as string,
    totalDives: parseInt(formData.get("totalDives") as string) || 0,
    preferredLanguage: (formData.get("preferredLanguage") as string) || "fr",
  };

  // Validate
  const parsed = diverPreferencesSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  try {
    await prisma.profile.update({
      where: { id: userId },
      data: {
        certificationLevel: parsed.data.certificationLevel || null,
        certificationOrg: parsed.data.certificationOrg || null,
        totalDives: parsed.data.totalDives || 0,
        preferredLanguage: parsed.data.preferredLanguage,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating diver preferences:", error);
    return {
      success: false,
      error: "Failed to update preferences",
    };
  }
}

export async function upgradeDiverProfile(
  preferencesData: {
    certificationLevel?: string;
    certificationOrg?: string;
    totalDives?: number;
    preferredLanguage: string;
  }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = diverPreferencesSchema.safeParse({
    certificationLevel: preferencesData.certificationLevel,
    certificationOrg: preferencesData.certificationOrg,
    totalDives: preferencesData.totalDives ?? 0,
    preferredLanguage: preferencesData.preferredLanguage,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  try {
    await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        certificationLevel: parsed.data.certificationLevel || null,
        certificationOrg: parsed.data.certificationOrg || null,
        totalDives: parsed.data.totalDives || 0,
        preferredLanguage: parsed.data.preferredLanguage,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error upgrading diver profile:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}

export async function completeDiverOnboard(
  locale: string,
  email: string,
  password: string
): Promise<ActionResult> {
  try {
    // Sign in the user
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error completing diver onboard:", error);
    return {
      success: false,
      error: "Failed to sign in",
    };
  }
}

export async function registerAndSignInDiver(
  locale: string,
  accountData: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  },
  preferencesData: {
    certificationLevel?: string;
    certificationOrg?: string;
    totalDives?: number;
    preferredLanguage: string;
  }
): Promise<ActionResult> {
  const { fullName, email, phone, password } = accountData;

  // Check if email already exists
  const existingUser = await prisma.profile.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return {
      success: false,
      error: "Email already registered",
    };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user with all data
  try {
    await prisma.profile.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: fullName,
        phone: phone || null,
        userType: "DIVER",
        preferredLanguage: preferencesData.preferredLanguage || locale,
        certificationLevel: preferencesData.certificationLevel || null,
        certificationOrg: preferencesData.certificationOrg || null,
        totalDives: preferencesData.totalDives || 0,
      },
    });

    // Sign in the user
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error registering diver:", error);
    return {
      success: false,
      error: "Failed to create account",
    };
  }
}
