import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

// Schema de validation pour l'inscription
const registerSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      );
    }

    const { fullName, email, password } = result.data;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.profile.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer le profil
    const user = await prisma.profile.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: fullName,
        userType: isAdminEmail(email) ? "ADMIN" : "DIVER",
        emailVerified: isAdminEmail(email) ? true : false,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        userType: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user,
        message: "Compte créé avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Une erreur s'est produite lors de l'inscription" },
      { status: 500 }
    );
  }
}
