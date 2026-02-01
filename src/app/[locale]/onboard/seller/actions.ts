"use server";

import { prisma } from "@/lib/prisma";
import { auth, hashPassword, signIn } from "@/lib/auth";
import {
  sellerAccountSchema,
  sellerProfileSchema,
  sellerServiceSchema,
  sellerServicesSchema,
} from "@/lib/validations/seller";
import { emailSchema, fullNameSchema, phoneSchema } from "@/lib/validations/auth";
import { z } from "zod";

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

const sellerUpgradeSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

export async function registerSeller(
  locale: string,
  accountData: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  },
  profileData: {
    bio: string;
    certifications: string[];
    languages: string[];
    photoUrl?: string;
  },
  servicesData: Array<{
    name: string;
    description: string;
    price: number;
    duration: number;
    maxParticipants?: number;
  }>
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

  try {
    // Create seller profile
    const profile = await prisma.profile.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: fullName,
        phone: phone || null,
        userType: "SELLER",
        preferredLanguage: locale,
        bio: profileData.bio,
        // Store certifications in bio for now (or add a field in schema)
        isActive: true,
      },
    });

    // Create a "virtual" dive center for the seller to attach services
    // This allows sellers without physical centers to offer services
    const sellerCenter = await prisma.diveCenter.create({
      data: {
        ownerId: profile.id,
        slug: `seller-${profile.id}`,
        name: { fr: fullName, en: fullName, es: fullName, it: fullName },
        description: { fr: profileData.bio, en: profileData.bio, es: profileData.bio, it: profileData.bio },
        address: "Independent Seller",
        city: "N/A",
        country: "N/A",
        latitude: 0,
        longitude: 0,
        email: email.toLowerCase(),
        phone: phone || "",
        certifications: profileData.certifications,
        languagesSpoken: profileData.languages,
        status: "PENDING", // Requires admin approval
      },
    });

    // Create services for the seller
    for (const service of servicesData) {
      await prisma.diveService.create({
        data: {
          centerId: sellerCenter.id,
          name: { fr: service.name, en: service.name, es: service.name, it: service.name },
          description: { fr: service.description, en: service.description, es: service.description, it: service.description },
          price: service.price,
          currency: "EUR",
          durationMinutes: service.duration,
          maxParticipants: service.maxParticipants || 1,
          isActive: true,
        },
      });
    }

    // Sign in the user
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    return {
      success: true,
      data: { profileId: profile.id, centerId: sellerCenter.id },
    };
  } catch (error) {
    console.error("Error registering seller:", error);
    return {
      success: false,
      error: "Failed to create seller account",
    };
  }
}

export async function upgradeSeller(
  accountData: {
    fullName: string;
    email: string;
    phone?: string;
  },
  profileData: {
    bio: string;
    certifications: string[];
    languages: string[];
    photoUrl?: string;
  },
  servicesData: Array<{
    name: string;
    description: string;
    price: number;
    duration: number;
    maxParticipants?: number;
  }>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const accountParsed = sellerUpgradeSchema.safeParse(accountData);
  if (!accountParsed.success) {
    return {
      success: false,
      error: accountParsed.error.issues[0]?.message || "Validation failed",
    };
  }

  const profileParsed = sellerProfileSchema.safeParse(profileData);
  if (!profileParsed.success) {
    return {
      success: false,
      error: profileParsed.error.issues[0]?.message || "Validation failed",
    };
  }

  const servicesParsed = sellerServicesSchema.safeParse({
    services: servicesData,
  });
  if (!servicesParsed.success) {
    return {
      success: false,
      error: servicesParsed.error.issues[0]?.message || "Validation failed",
    };
  }

  try {
    const normalizedEmail = session.user.email?.toLowerCase() ?? "";
    if (normalizedEmail !== accountParsed.data.email.toLowerCase()) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        displayName: accountParsed.data.fullName,
        phone: accountParsed.data.phone || null,
        userType: "SELLER",
        bio: profileParsed.data.bio,
        preferredLanguage: profileParsed.data.languages[0] ?? "fr",
        isActive: true,
      },
    });

    const sellerCenterSlug = `seller-${session.user.id}`;
    const existingCenter = await prisma.diveCenter.findFirst({
      where: { ownerId: session.user.id, slug: sellerCenterSlug },
      select: { id: true },
    });

    const sellerCenterId =
      existingCenter?.id ??
      (
        await prisma.diveCenter.create({
          data: {
            ownerId: session.user.id,
            slug: sellerCenterSlug,
            name: {
              fr: accountParsed.data.fullName,
              en: accountParsed.data.fullName,
              es: accountParsed.data.fullName,
              it: accountParsed.data.fullName,
            },
            description: {
              fr: profileParsed.data.bio,
              en: profileParsed.data.bio,
              es: profileParsed.data.bio,
              it: profileParsed.data.bio,
            },
            address: "Independent Seller",
            city: "N/A",
            country: "N/A",
            latitude: 0,
            longitude: 0,
            email: normalizedEmail,
            phone: accountParsed.data.phone || "",
            certifications: profileParsed.data.certifications,
            languagesSpoken: profileParsed.data.languages,
            status: "PENDING",
          },
        })
      ).id;

    await prisma.diveService.deleteMany({
      where: { centerId: sellerCenterId },
    });

    for (const service of servicesParsed.data.services) {
      await prisma.diveService.create({
        data: {
          centerId: sellerCenterId,
          name: {
            fr: service.name,
            en: service.name,
            es: service.name,
            it: service.name,
          },
          description: {
            fr: service.description,
            en: service.description,
            es: service.description,
            it: service.description,
          },
          price: service.price,
          currency: "EUR",
          durationMinutes: service.duration,
          maxParticipants: service.maxParticipants || 1,
          isActive: true,
        },
      });
    }

    return {
      success: true,
      data: { centerId: sellerCenterId },
    };
  } catch (error) {
    console.error("Error upgrading seller:", error);
    return {
      success: false,
      error: "Failed to upgrade seller",
    };
  }
}

export async function validateSellerAccount(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = sellerAccountSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  // Check if email exists
  const existingUser = await prisma.profile.findUnique({
    where: { email: rawData.email.toLowerCase() },
  });

  if (existingUser) {
    return {
      success: false,
      error: "Email already registered",
    };
  }

  return { success: true };
}

export async function validateSellerProfile(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    bio: formData.get("bio") as string,
    certifications: JSON.parse(formData.get("certifications") as string || "[]"),
    languages: JSON.parse(formData.get("languages") as string || "[]"),
    photoUrl: formData.get("photoUrl") as string,
  };

  const parsed = sellerProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  return { success: true };
}

export async function validateSellerService(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    price: parseFloat(formData.get("price") as string),
    duration: parseInt(formData.get("duration") as string),
    maxParticipants: parseInt(formData.get("maxParticipants") as string) || 1,
  };

  const parsed = sellerServiceSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  return { success: true };
}

// Placeholder for Stripe Connect
export async function connectSellerStripe(): Promise<ActionResult> {
  // TODO: Implement Stripe Connect flow
  // For now, just return success to allow progression
  return {
    success: true,
    data: { stripeConnected: false },
  };
}
