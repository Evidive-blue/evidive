import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validations/auth";
import type { UserType } from "@prisma/client";
import { ensureAdminProfileByEmail, isAdminEmail } from "@/lib/admin";

// Utility functions for password handling
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      userType: UserType;
      isEmailVerified: boolean;
    };
  }

  interface User {
    userType: UserType;
    isEmailVerified: boolean;
  }
}

// JWT type extension inline (module augmentation not working with next-auth 5)
// Types are enforced via explicit casting in callbacks

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const user = await prisma.profile.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            userType: true,
            emailVerified: true,
            isActive: true,
            isBlacklisted: true,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (!user.isActive || user.isBlacklisted) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Ensure configured admin email is always ADMIN
        if (isAdminEmail(normalizedEmail)) {
          await ensureAdminProfileByEmail(normalizedEmail);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          image: user.avatarUrl,
          userType: isAdminEmail(normalizedEmail) ? ("ADMIN" as UserType) : user.userType,
          isEmailVerified: isAdminEmail(normalizedEmail) ? true : user.emailVerified,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          userType: "DIVER" as UserType,
          isEmailVerified: profile.email_verified,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, create or update user in database
      if (account?.provider === "google") {
        const existingUser = await prisma.profile.findUnique({
          where: { email: user.email!.toLowerCase() },
        });

        if (!existingUser) {
          // Create new user from Google OAuth
          await prisma.profile.create({
            data: {
              email: user.email!.toLowerCase(),
              displayName: user.name,
              avatarUrl: user.image,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              userType: isAdminEmail(user.email) ? "ADMIN" : "DIVER",
            },
          });
        } else {
          // Update existing user's OAuth info
          if (!existingUser.avatarUrl && user.image) {
            await prisma.profile.update({
              where: { id: existingUser.id },
              data: {
                avatarUrl: user.image,
                emailVerified: true,
                emailVerifiedAt: existingUser.emailVerifiedAt || new Date(),
              },
            });
          }
        }

        if (user.email) {
          await ensureAdminProfileByEmail(user.email);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user && user.id) {
        // On sign in, add custom fields to token
        token.id = user.id;
        token.userType = user.userType;
        token.isEmailVerified = user.isEmailVerified;
        // Store email verification timestamp to avoid DB queries
        token.lastVerified = Date.now();
      } else if (token.email && trigger === "update") {
        // Only refresh from DB when explicitly triggered (e.g., after email verification)
        const dbUser = await prisma.profile.findUnique({
          where: { email: token.email.toLowerCase() },
          select: {
            id: true,
            userType: true,
            emailVerified: true,
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          if (isAdminEmail(token.email)) {
            token.userType = "ADMIN" as UserType;
            token.isEmailVerified = true;
          } else {
            token.userType = dbUser.userType;
            token.isEmailVerified = dbUser.emailVerified;
          }
          token.lastVerified = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.userType = token.userType as UserType;
      session.user.isEmailVerified = token.isEmailVerified as boolean;
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
