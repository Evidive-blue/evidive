"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, signIn } from "@/lib/auth";
import { centerApplicationSchema } from "@/lib/validations/centerRegistration";
import { getAdminEmail } from "@/lib/admin";
import { sendEmail } from "@/lib/mailer";
import { headers } from "next/headers";

// Rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function getRateLimitKey(ip: string): string {
  return `center-register:${ip}`;
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

export type CenterApplicationResult = {
  success: boolean;
  error?: string;
  errorCode?:
    | "RATE_LIMIT"
    | "EMAIL_EXISTS"
    | "VALIDATION"
    | "SERVER_ERROR"
    | "BLACKLISTED";
  data?: {
    profileId: string;
    centerId: string;
  };
};

export async function createCenterApplication(
  locale: string,
  formData: {
    // Personal info
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    // Center info
    centerName: { fr: string; en: string };
    street: string;
    city: string;
    postalCode?: string;
    country: string;
    latitude: number;
    longitude: number;
    website?: string;
    shortDescription: { fr: string; en: string };
    // Legal info
    companyName?: string;
    siretOrVat?: string;
    certifications: string[];
    // Terms
    termsAccepted: boolean;
  }
): Promise<CenterApplicationResult> {
  // Get client IP for rate limiting
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0] ?? "127.0.0.1";

  // Check rate limit
  const rateLimitResult = checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: "Trop de tentatives. Veuillez réessayer plus tard.",
      errorCode: "RATE_LIMIT",
    };
  }

  // Validate input
  const parsed = centerApplicationSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message || "Validation échouée",
      errorCode: "VALIDATION",
    };
  }

  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    centerName,
    street,
    city,
    postalCode,
    country,
    latitude,
    longitude,
    website,
    shortDescription,
    companyName,
    siretOrVat,
    certifications,
  } = parsed.data;

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if email already exists
    const existingUser = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isBlacklisted: true },
    });

    if (existingUser) {
      if (existingUser.isBlacklisted) {
        return {
          success: false,
          error: "Cet email ne peut pas être utilisé pour l'inscription",
          errorCode: "BLACKLISTED",
        };
      }
      return {
        success: false,
        error: "Un compte existe déjà avec cet email",
        errorCode: "EMAIL_EXISTS",
      };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create profile and center in transaction
    const { profile, center } = await prisma.$transaction(async (tx) => {
      // Create profile
      const profile = await tx.profile.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`.trim(),
          phone,
          userType: "CENTER_OWNER",
          preferredLanguage: locale,
          address: street,
          city,
          zip: postalCode || null,
          country,
          isActive: true,
          emailVerified: false,
        },
      });

      // Generate slug from center name
      const slug =
        centerName.fr
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        profile.id.slice(0, 6);

      // Create dive center
      const center = await tx.diveCenter.create({
        data: {
          ownerId: profile.id,
          slug,
          name: {
            fr: centerName.fr,
            en: centerName.en,
            de: centerName.en,
            es: centerName.en,
            it: centerName.en,
          },
          description: {
            fr: shortDescription.fr,
            en: shortDescription.en,
            de: shortDescription.en,
            es: shortDescription.en,
            it: shortDescription.en,
          },
          shortDescription: {
            fr: shortDescription.fr,
            en: shortDescription.en,
            de: shortDescription.en,
            es: shortDescription.en,
            it: shortDescription.en,
          },
          address: street,
          city,
          zip: postalCode || null,
          country,
          latitude,
          longitude,
          email: normalizedEmail,
          phone,
          website: website || null,
          certifications: certifications,
          status: "PENDING", // Requires admin approval
        },
      });

      return { profile, center };
    });

    // Send confirmation email to center
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "EviDive - Votre demande d'inscription a été reçue",
        template: "center_application_received",
        html: `
          <h1>Bonjour ${firstName},</h1>
          <p>Nous avons bien reçu votre demande d'inscription pour le centre <strong>${centerName.fr}</strong>.</p>
          <p>Notre équipe va examiner votre dossier et vous recontactera sous 48-72h.</p>
          <h2>Récapitulatif :</h2>
          <ul>
            <li><strong>Centre :</strong> ${centerName.fr}</li>
            <li><strong>Adresse :</strong> ${street}, ${city}, ${country}</li>
            <li><strong>Email :</strong> ${normalizedEmail}</li>
            <li><strong>Téléphone :</strong> ${phone}</li>
            ${companyName ? `<li><strong>Société :</strong> ${companyName}</li>` : ""}
            ${certifications.length > 0 ? `<li><strong>Certifications :</strong> ${certifications.join(", ")}</li>` : ""}
          </ul>
          <p>Merci de votre confiance,<br>L'équipe EviDive</p>
        `,
        text: `
Bonjour ${firstName},

Nous avons bien reçu votre demande d'inscription pour le centre ${centerName.fr}.
Notre équipe va examiner votre dossier et vous recontactera sous 48-72h.

Récapitulatif :
- Centre : ${centerName.fr}
- Adresse : ${street}, ${city}, ${country}
- Email : ${normalizedEmail}
- Téléphone : ${phone}
${companyName ? `- Société : ${companyName}` : ""}
${certifications.length > 0 ? `- Certifications : ${certifications.join(", ")}` : ""}

Merci de votre confiance,
L'équipe EviDive
        `,
        metadata: {
          centerId: center.id,
          ownerProfileId: profile.id,
        },
        userId: profile.id,
        centerId: center.id,
      });
    } catch {
      // Best effort - don't fail registration if email fails
      console.error("Failed to send confirmation email to center");
    }

    // Notify admin
    const adminEmail = getAdminEmail();
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `[EviDive] Nouvelle demande centre: ${centerName.fr}`,
          template: "center_pending_admin",
          html: `
            <h1>Nouvelle demande d'inscription centre</h1>
            <h2>Informations du représentant</h2>
            <ul>
              <li><strong>Nom :</strong> ${firstName} ${lastName}</li>
              <li><strong>Email :</strong> ${normalizedEmail}</li>
              <li><strong>Téléphone :</strong> ${phone}</li>
            </ul>
            <h2>Informations du centre</h2>
            <ul>
              <li><strong>Nom FR :</strong> ${centerName.fr}</li>
              <li><strong>Nom EN :</strong> ${centerName.en}</li>
              <li><strong>Adresse :</strong> ${street}, ${postalCode || ""} ${city}, ${country}</li>
              <li><strong>Coordonnées :</strong> ${latitude}, ${longitude}</li>
              ${website ? `<li><strong>Site web :</strong> ${website}</li>` : ""}
            </ul>
            <h2>Informations légales</h2>
            <ul>
              ${companyName ? `<li><strong>Société :</strong> ${companyName}</li>` : "<li>Société : Non renseigné</li>"}
              ${siretOrVat ? `<li><strong>SIRET/TVA :</strong> ${siretOrVat}</li>` : "<li>SIRET/TVA : Non renseigné</li>"}
              <li><strong>Certifications :</strong> ${certifications.length > 0 ? certifications.join(", ") : "Aucune"}</li>
            </ul>
            <h2>Description</h2>
            <p><strong>FR :</strong> ${shortDescription.fr}</p>
            <p><strong>EN :</strong> ${shortDescription.en}</p>
            <hr>
            <p><strong>Center ID :</strong> ${center.id}</p>
            <p><strong>Profile ID :</strong> ${profile.id}</p>
          `,
          text: `
Nouvelle demande d'inscription centre

Représentant: ${firstName} ${lastName}
Email: ${normalizedEmail}
Téléphone: ${phone}

Centre: ${centerName.fr}
Adresse: ${street}, ${postalCode || ""} ${city}, ${country}
Coordonnées: ${latitude}, ${longitude}
Site web: ${website || "Non renseigné"}

Société: ${companyName || "Non renseigné"}
SIRET/TVA: ${siretOrVat || "Non renseigné"}
Certifications: ${certifications.length > 0 ? certifications.join(", ") : "Aucune"}

Description FR: ${shortDescription.fr}
Description EN: ${shortDescription.en}

Center ID: ${center.id}
Profile ID: ${profile.id}
          `,
          metadata: {
            centerId: center.id,
            ownerProfileId: profile.id,
            centerEmail: normalizedEmail,
          },
          centerId: center.id,
          userId: profile.id,
        });
      } catch {
        // Best effort
        console.error("Failed to send admin notification email");
      }
    }

    // Auto sign-in the user
    try {
      await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });
    } catch {
      // If auto sign-in fails, still return success
      console.error("Auto sign-in failed after center registration");
    }

    return {
      success: true,
      data: {
        profileId: profile.id,
        centerId: center.id,
      },
    };
  } catch (error) {
    console.error("Error creating center application:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
      errorCode: "SERVER_ERROR",
    };
  }
}

// Check email availability
export async function checkCenterEmailAvailability(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.profile.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  return !existingUser;
}
