import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Prisma, Role } from "@prisma/client";

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role"); // DIVER, ADMIN
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: Prisma.DiverWhereInput = {};
    
    if (roleParam) {
      where.role = roleParam as Role;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order by
    const orderBy: Prisma.DiverOrderByWithRelationInput = {
      [sortBy]: sortOrder as "asc" | "desc",
    };

    const [users, total] = await Promise.all([
      prisma.diver.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          emailVerified: true,
          isActive: true,
          isBlacklisted: true,
          createdAt: true,
          _count: {
            select: {
              centers: true,
              bookings: true,
              reviews: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.diver.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
