"use server";

import { prisma } from "@/lib/prisma";
import { auth, hashPassword, signIn } from "@/lib/auth";
import {
  centerAccountSchema,
  centerCreateSchema,
  centerInfoSchema,
  centerLocationSchema,
} from "@/lib/validations/center";
import { getAdminEmail } from "@/lib/admin";
import { sendEmail } from "@/lib/mailer";
import { emailSchema, fullNameSchema, phoneSchema } from "@/lib/validations/auth";
import { z } from "zod";

export type ActionResult = {
  success: boolean;
  error?: string;
  errorCode?:
    | "VALIDATION_FAILED"
    | "EMAIL_ALREADY_REGISTERED"
    | "CENTER_REGISTER_FAILED"
    | "NOT_IMPLEMENTED";
  data?: Record<string, unknown>;
};

const centerUpgradeSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

export async function registerCenter(
  locale: string,
  accountData: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  },
  centerInfo: {
    centerName: string;
    description: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    centerPhone?: string;
  },
  locationData: {
    address: string;
    city: string;
    postalCode?: string;
    country: string;
    latitude?: number;
    longitude?: number;
  }
): Promise<ActionResult> {
  const validated = centerCreateSchema.safeParse({
    ...accountData,
    ...centerInfo,
    ...locationData,
  });
  if (!validated.success) {
    return { success: false, errorCode: "VALIDATION_FAILED", error: "Validation failed" };
  }

  const { fullName, email, phone, password } = accountData;
  const finalPhone = (centerInfo.centerPhone || phone || "").trim();
  if (finalPhone.length === 0) {
    return { success: false, errorCode: "VALIDATION_FAILED", error: "Validation failed" };
  }

  const { latitude, longitude } = validated.data;

  // Check if email already exists
  const existingUser = await prisma.profile.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return {
      success: false,
      errorCode: "EMAIL_ALREADY_REGISTERED",
      error: "Email already registered",
    };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  try {
    const { profile, center } = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          displayName: fullName,
          phone: phone || null,
          userType: "CENTER_OWNER",
          preferredLanguage: locale,
          address: locationData.address,
          city: locationData.city,
          zip: locationData.postalCode,
          country: locationData.country,
          isActive: true,
        },
      });

      // Generate slug from center name
      const slug =
        centerInfo.centerName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        profile.id.slice(0, 6);

      const center = await tx.diveCenter.create({
        data: {
          ownerId: profile.id,
          slug,
          name: {
            fr: centerInfo.centerName,
            en: centerInfo.centerName,
            de: centerInfo.centerName,
            es: centerInfo.centerName,
            it: centerInfo.centerName,
          },
          description: {
            fr: centerInfo.description,
            en: centerInfo.description,
            de: centerInfo.description,
            es: centerInfo.description,
            it: centerInfo.description,
          },
          address: locationData.address,
          city: locationData.city,
          zip: locationData.postalCode,
          country: locationData.country,
          latitude,
          longitude,
          email: email.toLowerCase(),
          phone: finalPhone,
          website: centerInfo.website || null,
          facebook: centerInfo.facebook || null,
          instagram: centerInfo.instagram || null,
          status: "PENDING", // Requires admin approval
        },
      });

      return { profile, center };
    });

    // Notify admin (best-effort; should not block onboarding)
    const adminEmail = getAdminEmail();
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `[EviDive] Nouveau centre en attente: ${centerInfo.centerName}`,
          template: "center_pending",
          text: [
            "Un nouveau centre vient d’être créé et est en attente de validation.",
            "",
            `Nom: ${centerInfo.centerName}`,
            `Email: ${email.toLowerCase()}`,
            `Ville: ${locationData.city}`,
            `Pays: ${locationData.country}`,
            `CenterId: ${center.id}`,
          ].join("\n"),
          metadata: {
            centerId: center.id,
            ownerProfileId: profile.id,
            centerEmail: email.toLowerCase(),
          },
          centerId: center.id,
          userId: profile.id,
        });
      } catch {
        // ignore
      }
    }

    // Sign in the user
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    return {
      success: true,
      data: { profileId: profile.id, centerId: center.id },
    };
  } catch {
    return {
      success: false,
      errorCode: "CENTER_REGISTER_FAILED",
      error: "Failed to create center account",
    };
  }
}

export async function upgradeCenter(
  accountData: {
    fullName: string;
    email: string;
    phone?: string;
  },
  centerInfo: {
    centerName: string;
    description: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    centerPhone?: string;
  },
  locationData: {
    address: string;
    city: string;
    postalCode?: string;
    country: string;
    latitude?: number;
    longitude?: number;
  }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, errorCode: "CENTER_REGISTER_FAILED", error: "Unauthorized" };
  }

  const accountParsed = centerUpgradeSchema.safeParse(accountData);
  if (!accountParsed.success) {
    return { success: false, errorCode: "VALIDATION_FAILED", error: "Validation failed" };
  }

  const infoParsed = centerInfoSchema.safeParse({
    centerName: centerInfo.centerName,
    description: centerInfo.description,
    website: centerInfo.website,
    facebook: centerInfo.facebook,
    instagram: centerInfo.instagram,
    phone: centerInfo.centerPhone || accountData.phone || "",
  });
  if (!infoParsed.success) {
    return { success: false, errorCode: "VALIDATION_FAILED", error: "Validation failed" };
  }

  if (typeof locationData.latitude !== "number" || typeof locationData.longitude !== "number") {
    return { success: false, errorCode: "VALIDATION_FAILED", error: "Validation failed" };
  }

  const locationParsed = centerLocationSchema.safeParse({
    address: locationData.address,
    city: locationData.city,
    postalCode: locationData.postalCode,
    country: locationData.country,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
  });
  if (!locationParsed.success) {
    return { success: false, errorCode: "VALIDATION_FAILED", error: "Validation failed" };
  }

  try {
    const normalizedEmail = session.user.email?.toLowerCase() ?? "";
    if (normalizedEmail !== accountParsed.data.email.toLowerCase()) {
      return { success: false, errorCode: "CENTER_REGISTER_FAILED", error: "Unauthorized" };
    }

    const { profile, center } = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.update({
        where: { id: session.user.id },
        data: {
          displayName: accountParsed.data.fullName,
          phone: accountParsed.data.phone || null,
          userType: "CENTER_OWNER",
          address: locationParsed.data.address,
          city: locationParsed.data.city,
          zip: locationParsed.data.postalCode,
          country: locationParsed.data.country,
          isActive: true,
        },
      });

      const slug =
        centerInfo.centerName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        profile.id.slice(0, 6);

      const center = await tx.diveCenter.create({
        data: {
          ownerId: profile.id,
          slug,
          name: {
            fr: centerInfo.centerName,
            en: centerInfo.centerName,
            de: centerInfo.centerName,
            es: centerInfo.centerName,
            it: centerInfo.centerName,
          },
          description: {
            fr: centerInfo.description,
            en: centerInfo.description,
            de: centerInfo.description,
            es: centerInfo.description,
            it: centerInfo.description,
          },
          address: locationParsed.data.address,
          city: locationParsed.data.city,
          zip: locationParsed.data.postalCode,
          country: locationParsed.data.country,
          latitude: locationParsed.data.latitude,
          longitude: locationParsed.data.longitude,
          email: normalizedEmail,
          phone: (centerInfo.centerPhone || accountParsed.data.phone || "").trim(),
          website: centerInfo.website || null,
          facebook: centerInfo.facebook || null,
          instagram: centerInfo.instagram || null,
          status: "PENDING",
        },
      });

      return { profile, center };
    });

    const adminEmail = getAdminEmail();
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `[EviDive] Nouveau centre en attente: ${centerInfo.centerName}`,
          template: "center_pending",
          text: [
            "Un nouveau centre vient d’être créé et est en attente de validation.",
            "",
            `Nom: ${centerInfo.centerName}`,
            `Email: ${normalizedEmail}`,
            `Ville: ${locationData.city}`,
            `Pays: ${locationData.country}`,
            `CenterId: ${center.id}`,
          ].join("\n"),
          metadata: {
            centerId: center.id,
            ownerProfileId: profile.id,
            centerEmail: normalizedEmail,
          },
          centerId: center.id,
          userId: profile.id,
        });
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      data: { profileId: profile.id, centerId: center.id },
    };
  } catch {
    return {
      success: false,
      errorCode: "CENTER_REGISTER_FAILED",
      error: "Failed to create center account",
    };
  }
}

export async function validateCenterAccount(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = centerAccountSchema.safeParse(rawData);
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

export async function validateCenterInfo(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    centerName: formData.get("centerName") as string,
    description: formData.get("description") as string,
    website: formData.get("website") as string,
    facebook: formData.get("facebook") as string,
    instagram: formData.get("instagram") as string,
    phone: formData.get("phone") as string,
  };

  const parsed = centerInfoSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  return { success: true };
}

export async function validateCenterLocation(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    postalCode: formData.get("postalCode") as string,
    country: formData.get("country") as string,
    latitude: parseFloat(formData.get("latitude") as string) || undefined,
    longitude: parseFloat(formData.get("longitude") as string) || undefined,
  };

  const parsed = centerLocationSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  return { success: true };
}

// Placeholder for document upload
export async function uploadCenterDocument(
  _formData: FormData
): Promise<ActionResult> {
  void _formData;
  // TODO: Implement file upload to S3/Cloudinary
  return {
    success: false,
    errorCode: "NOT_IMPLEMENTED",
    error: "Not implemented",
  };
}

// Placeholder for Stripe Connect
export async function connectCenterStripe(): Promise<ActionResult> {
  // TODO: Implement Stripe Connect flow
  return {
    success: false,
    errorCode: "NOT_IMPLEMENTED",
    error: "Not implemented",
  };
}
