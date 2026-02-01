import type { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getAdminEmail(): string | null {
  const raw = process.env.ADMIN_EMAIL?.trim();
  if (!raw) return null;
  return normalizeEmail(raw);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmail = getAdminEmail();
  if (!adminEmail) return false;
  return normalizeEmail(email) === adminEmail;
}

export async function ensureAdminProfileByEmail(email: string): Promise<void> {
  if (!isAdminEmail(email)) return;

  const normalized = normalizeEmail(email);
  const profile = await prisma.profile.findUnique({
    where: { email: normalized },
    select: { id: true, userType: true, emailVerified: true, emailVerifiedAt: true },
  });

  if (!profile) return;

  const updates: Partial<{ userType: UserType; emailVerified: boolean; emailVerifiedAt: Date }> = {};
  if (profile.userType !== ("ADMIN" as UserType)) {
    updates.userType = "ADMIN" as UserType;
  }
  if (!profile.emailVerified) {
    updates.emailVerified = true;
    updates.emailVerifiedAt = profile.emailVerifiedAt ?? new Date();
  }

  if (Object.keys(updates).length === 0) return;

  await prisma.profile.update({
    where: { id: profile.id },
    data: updates,
  });
}

