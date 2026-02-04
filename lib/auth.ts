import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { prisma } from "./db/prisma";
import { z } from "zod";

// ============================================
// Types
// ============================================
export type UserRole = "DIVER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: UserRole;
      isEmailVerified: boolean;
      hasCenters: boolean;
    };
  }

  interface User {
    role: UserRole;
    isEmailVerified: boolean;
    hasCenters: boolean;
  }
}

// ============================================
// Validation Schemas
// ============================================
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ============================================
// Password Utilities
// ============================================
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// ============================================
// Admin Check
// ============================================
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || "").split(",").map((e) => e.trim().toLowerCase());

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ============================================
// NextAuth Configuration
// ============================================
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Credentials Provider
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const user = await prisma.diver.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
            emailVerified: true,
            isActive: true,
            centers: { select: { id: true }, take: 1 },
          },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        // Force ADMIN role for configured admin emails
        const role = isAdminEmail(normalizedEmail) ? "ADMIN" : user.role;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          image: user.avatarUrl,
          role,
          isEmailVerified: isAdminEmail(normalizedEmail) ? true : user.emailVerified,
          hasCenters: user.centers.length > 0,
        };
      },
    }),

    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        const normalizedEmail = profile.email?.toLowerCase();
        const email = normalizedEmail ?? profile.email;
        return {
          id: profile.sub,
          email,
          name: profile.name,
          image: profile.picture,
          role: isAdminEmail(email) ? "ADMIN" : "DIVER",
          isEmailVerified: profile.email_verified,
          hasCenters: false, // Will be updated in signIn callback
        };
      },
    }),
  ],

  callbacks: {
    // Handle OAuth sign-in (create/update user)
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const normalizedEmail = user.email.toLowerCase();

        const existingUser = await prisma.diver.findUnique({
          where: { email: normalizedEmail },
          include: { centers: { select: { id: true }, take: 1 } },
        });

        if (!existingUser) {
          // Create new user from Google OAuth
          await prisma.diver.create({
            data: {
              email: normalizedEmail,
              displayName: user.name,
              avatarUrl: user.image,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              role: isAdminEmail(normalizedEmail) ? "ADMIN" : "DIVER",
            },
          });
        } else {
          // Update existing user's avatar if missing
          if (!existingUser.avatarUrl && user.image) {
            await prisma.diver.update({
              where: { id: existingUser.id },
              data: {
                avatarUrl: user.image,
                emailVerified: true,
                emailVerifiedAt: existingUser.emailVerifiedAt || new Date(),
              },
            });
          }
          // Update hasCenters flag
          user.hasCenters = existingUser.centers.length > 0;
        }
      }
      return true;
    },

    // Add custom fields to JWT
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
        token.isEmailVerified = user.isEmailVerified;
        token.hasCenters = user.hasCenters;
      } else if (token.email && trigger === "update") {
        // Refresh from DB when triggered
        const dbUser = await prisma.diver.findUnique({
          where: { email: token.email.toLowerCase() },
          select: {
            id: true,
            role: true,
            emailVerified: true,
            centers: { select: { id: true }, take: 1 },
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = isAdminEmail(token.email) ? "ADMIN" : dbUser.role;
          token.isEmailVerified = dbUser.emailVerified;
          token.hasCenters = dbUser.centers.length > 0;
        }
      }
      return token;
    },

    // Expose custom fields in session
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.isEmailVerified = token.isEmailVerified as boolean;
      session.user.hasCenters = token.hasCenters as boolean;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  trustHost: true,
});

// ============================================
// Helper: Get current user server-side
// ============================================
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

// ============================================
// Helper: Require auth (throws if not authenticated)
// ============================================
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// ============================================
// Helper: Require admin
// ============================================
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}
