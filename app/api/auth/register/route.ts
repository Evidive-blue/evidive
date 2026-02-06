import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, registerSchema } from "@/lib/auth";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.diver.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.diver.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName,
        lastName,
        displayName: firstName && lastName ? `${firstName} ${lastName}` : firstName || null,
        role: "DIVER",
        emailVerified: false,
        verificationToken,
        verificationExpires,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      user.firstName || "there",
      verificationToken
    );

    if (!emailResult.success) {
      console.warn("[Register] Failed to send verification email:", emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: "Account created. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
