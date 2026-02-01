"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  centerIdentitySchema,
  centerDescriptionSchema,
  centerContactSchema,
  centerPracticalSchema,
  centerEngagementSchema,
  centerLocationSchema,
  centerPaymentsSchema,
  centerProfileSchema,
  type CenterIdentityData,
  type CenterDescriptionData,
  type CenterContactData,
  type CenterPracticalData,
  type CenterEngagementData,
  type CenterLocationData,
  type CenterPaymentsData,
  type CenterProfileData,
} from "@/lib/validations/centerProfile";

// ============================================
// Helper: Get user's center
// ============================================

async function getUserCenter() {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "Non authentifié", center: null };
  }

  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    return { error: "Accès non autorisé", center: null };
  }

  const center = await prisma.diveCenter.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!center) {
    return { error: "Centre non trouvé", center: null };
  }

  return { error: null, center };
}

// ============================================
// Section 1: Identity
// ============================================

export async function updateCenterIdentity(data: CenterIdentityData) {
  const { error, center } = await getUserCenter();
  if (error || !center) {
    return { success: false, error: error || "Centre non trouvé" };
  }

  const parsed = centerIdentitySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Données invalides", errors: parsed.error.flatten() };
  }

  try {
    await prisma.diveCenter.update({
      where: { id: center.id },
      data: {
        name: parsed.data.name,
        logoUrl: parsed.data.logoUrl,
        featuredImage: parsed.data.featuredImage,
        photos: parsed.data.photos,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/center/profile");
    revalidatePath(`/centers/${center.slug}`);
    
    return { success: true };
  } catch (err) {
    console.error("updateCenterIdentity error:", err);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ============================================
// Section 2: Description
// ============================================

export async function updateCenterDescription(data: CenterDescriptionData) {
  const { error, center } = await getUserCenter();
  if (error || !center) {
    return { success: false, error: error || "Centre non trouvé" };
  }

  const parsed = centerDescriptionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Données invalides", errors: parsed.error.flatten() };
  }

  try {
    await prisma.diveCenter.update({
      where: { id: center.id },
      data: {
        shortDescription: parsed.data.shortDescription,
        description: parsed.data.description,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/center/profile");
    revalidatePath(`/centers/${center.slug}`);
    
    return { success: true };
  } catch (err) {
    console.error("updateCenterDescription error:", err);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ============================================
// Section 3: Contact
// ============================================

export async function updateCenterContact(data: CenterContactData) {
  const { error, center } = await getUserCenter();
  if (error || !center) {
    return { success: false, error: error || "Centre non trouvé" };
  }

  const parsed = centerContactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Données invalides", errors: parsed.error.flatten() };
  }

  try {
    await prisma.diveCenter.update({
      where: { id: center.id },
      data: {
        address: parsed.data.address,
        street2: parsed.data.street2 || null,
        city: parsed.data.city,
        region: parsed.data.region || null,
        country: parsed.data.country,
        zip: parsed.data.zip || null,
        phone: parsed.data.phone || center.phone,
        email: parsed.data.email,
        website: parsed.data.website || null,
        facebook: parsed.data.facebook || null,
        instagram: parsed.data.instagram || null,
        whatsapp: parsed.data.whatsapp || null,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/center/profile");
    revalidatePath(`/centers/${center.slug}`);
    
    return { success: true };
  } catch (err) {
    console.error("updateCenterContact error:", err);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ============================================
// Section 4: Practical Info
// ============================================

export async function updateCenterPractical(data: CenterPracticalData) {
  const { error, center } = await getUserCenter();
  if (error || !center) {
    return { success: false, error: error || "Centre non trouvé" };
  }

  const parsed = centerPracticalSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Données invalides", errors: parsed.error.flatten() };
  }

  try {
    await prisma.diveCenter.update({
      where: { id: center.id },
      data: {
        openingHours: parsed.data.openingHours || undefined,
        languagesSpoken: parsed.data.languagesSpoken,
        certifications: parsed.data.certifications,
        equipmentRental: parsed.data.equipmentRental,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/center/profile");
    revalidatePath(`/centers/${center.slug}`);
    
    return { success: true };
  } catch (err) {
    console.error("updateCenterPractical error:", err);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ============================================
// Section 5: Engagement
// ============================================

export async function updateCenterEngagement(data: CenterEngagementData) {
  const { error, center } = await getUserCenter();
  if (error || !center) {
    return { success: false, error: error || "Centre non trouvé" };
  }

  const parsed = centerEngagementSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Données invalides", errors: parsed.error.flatten() };
  }

  try {
    await prisma.diveCenter.update({
      where: { id: center.id },
      data: {
        ecoCommitment: parsed.data.ecoCommitment || null,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/center/profile");
    revalidatePath(`/centers/${center.slug}`);
    
    return { success: true };
  } catch (err) {
    console.error("updateCenterEngagement error:", err);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ============================================
// Section 6: Location
// ============================================

export async function updateCenterLocation(data: CenterLocationData) {
  const { error, center } = await getUserCenter();
  if (error || !center) {
    return { success: false, error: error || "Centre non trouvé" };
  }

  const parsed = centerLocationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Données invalides", errors: parsed.error.flatten() };
  }

  try {
    await prisma.diveCenter.update({
      where: { id: center.id },
      data: {
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/center/profile");
    revalidatePath(`/centers/${center.slug}`);
    
    return { success: true };
  } catch (err) {
    console.error("updateCenterLocation error:", err);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ============================================
// Section 7: Payments
// ============================================

export async function updateCenterPayments(data: CenterPaymentsData) {
  const { error, center } = await getUserCenter();
  if (error || !center) {
    return { success: false, error: error || "Centre non trouvé" };
  }

  const parsed = centerPaymentsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Données invalides", errors: parsed.error.flatten() };
  }

  try {
    await prisma.diveCenter.update({
      where: { id: center.id },
      data: {
        paymentTypes: parsed.data.paymentTypes,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/center/profile");
    revalidatePath(`/centers/${center.slug}`);
    
    return { success: true };
  } catch (err) {
    console.error("updateCenterPayments error:", err);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ============================================
// Global Save (all sections)
// ============================================

export async function updateCenterProfile(data: CenterProfileData) {
  const { error, center } = await getUserCenter();
  if (error || !center) {
    return { success: false, error: error || "Centre non trouvé" };
  }

  const parsed = centerProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Données invalides", errors: parsed.error.flatten() };
  }

  try {
    await prisma.diveCenter.update({
      where: { id: center.id },
      data: {
        // Identity
        name: parsed.data.name,
        logoUrl: parsed.data.logoUrl,
        featuredImage: parsed.data.featuredImage,
        photos: parsed.data.photos,
        
        // Description
        shortDescription: parsed.data.shortDescription,
        description: parsed.data.description,
        
        // Contact
        address: parsed.data.address,
        street2: parsed.data.street2 || null,
        city: parsed.data.city,
        region: parsed.data.region || null,
        country: parsed.data.country,
        zip: parsed.data.zip || null,
        phone: parsed.data.phone || center.phone,
        email: parsed.data.email,
        website: parsed.data.website || null,
        facebook: parsed.data.facebook || null,
        instagram: parsed.data.instagram || null,
        whatsapp: parsed.data.whatsapp || null,
        
        // Practical
        openingHours: parsed.data.openingHours || undefined,
        languagesSpoken: parsed.data.languagesSpoken,
        certifications: parsed.data.certifications,
        equipmentRental: parsed.data.equipmentRental,
        
        // Engagement
        ecoCommitment: parsed.data.ecoCommitment || null,
        
        // Payments
        paymentTypes: parsed.data.paymentTypes,
        
        // Location
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        
        updatedAt: new Date(),
      },
    });

    revalidatePath("/center/profile");
    revalidatePath(`/centers/${center.slug}`);
    
    return { success: true };
  } catch (err) {
    console.error("updateCenterProfile error:", err);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ============================================
// Get Center Profile Data
// ============================================

export async function getCenterProfile() {
  const { error, center } = await getUserCenter();
  if (error || !center) {
    return { success: false, error: error || "Centre non trouvé", data: null };
  }

  return {
    success: true,
    data: {
      id: center.id,
      slug: center.slug,
      // Identity
      name: center.name as Record<string, string>,
      logoUrl: center.logoUrl,
      featuredImage: center.featuredImage,
      photos: center.photos,
      // Description
      shortDescription: center.shortDescription as Record<string, string> | null,
      description: center.description as Record<string, string>,
      // Contact
      address: center.address,
      street2: center.street2,
      city: center.city,
      region: center.region,
      country: center.country,
      zip: center.zip,
      phone: center.phone,
      email: center.email,
      website: center.website,
      facebook: center.facebook,
      instagram: center.instagram,
      whatsapp: center.whatsapp,
      // Practical
      openingHours: center.openingHours as Record<string, unknown> | null,
      languagesSpoken: center.languagesSpoken,
      certifications: center.certifications,
      equipmentRental: center.equipmentRental,
      // Engagement
      ecoCommitment: center.ecoCommitment,
      // Payments
      paymentTypes: center.paymentTypes,
      stripeAccountId: center.stripeAccountId,
      // Location
      latitude: Number(center.latitude),
      longitude: Number(center.longitude),
      // Status
      status: center.status,
      verified: center.verified,
    },
  };
}
