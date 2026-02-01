"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { UserType } from "@prisma/client";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized.");
  if (session.user.userType !== "ADMIN") throw new Error("Unauthorized.");
  return session.user;
}

const setUserTypeSchema = z.object({
  userId: z.string().min(1),
  userType: z.enum(["DIVER", "SELLER", "CENTER_OWNER", "ADMIN"]),
  locale: z.string().min(1),
});

export async function setUserType(formData: FormData): Promise<void> {
  const admin = await assertAdmin();

  const parsed = setUserTypeSchema.safeParse({
    userId: formData.get("userId"),
    userType: formData.get("userType"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) throw new Error("Invalid payload.");

  if (parsed.data.userId === admin.id) {
    // Avoid removing admin access to self accidentally
    if (parsed.data.userType !== "ADMIN") throw new Error("Cannot change your own role.");
  }

  await prisma.profile.update({
    where: { id: parsed.data.userId },
    data: { userType: parsed.data.userType as UserType },
  });

  revalidatePath(`/${parsed.data.locale}/admin/users`);
}

const setFlagsSchema = z.object({
  userId: z.string().min(1),
  isActive: z.enum(["true", "false"]).optional(),
  isBlacklisted: z.enum(["true", "false"]).optional(),
  locale: z.string().min(1),
});

export async function setUserFlags(formData: FormData): Promise<void> {
  const admin = await assertAdmin();

  const parsed = setFlagsSchema.safeParse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive"),
    isBlacklisted: formData.get("isBlacklisted"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) throw new Error("Invalid payload.");

  if (parsed.data.userId === admin.id) {
    // Avoid locking yourself out
    if (parsed.data.isActive === "false" || parsed.data.isBlacklisted === "true") {
      throw new Error("Cannot disable/blacklist your own account.");
    }
  }

  await prisma.profile.update({
    where: { id: parsed.data.userId },
    data: {
      ...(parsed.data.isActive ? { isActive: parsed.data.isActive === "true" } : {}),
      ...(parsed.data.isBlacklisted ? { isBlacklisted: parsed.data.isBlacklisted === "true" } : {}),
    },
  });

  revalidatePath(`/${parsed.data.locale}/admin/users`);
}

const deleteSchema = z.object({
  userId: z.string().min(1),
  locale: z.string().min(1),
});

export async function deleteUser(formData: FormData): Promise<void> {
  const admin = await assertAdmin();

  const parsed = deleteSchema.safeParse({
    userId: formData.get("userId"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) throw new Error("Invalid payload.");

  if (parsed.data.userId === admin.id) {
    throw new Error("Cannot delete your own account.");
  }

  await prisma.profile.delete({ where: { id: parsed.data.userId } });

  revalidatePath(`/${parsed.data.locale}/admin/users`);
}

