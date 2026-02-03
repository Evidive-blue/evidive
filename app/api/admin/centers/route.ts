import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { CenterStatus, Prisma } from "@prisma/client";

// GET - List all centers (admin only)
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
    const statusParam = searchParams.get("status"); // PENDING, APPROVED, REJECTED, SUSPENDED
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Prisma.CenterWhereInput = statusParam 
      ? { status: statusParam as CenterStatus } 
      : {};

    const [centers, total] = await Promise.all([
      prisma.center.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          email: true,
          city: true,
          country: true,
          status: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
              services: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.center.count({ where }),
    ]);

    return NextResponse.json({
      centers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching centers:", error);
    return NextResponse.json(
      { error: "Failed to fetch centers" },
      { status: 500 }
    );
  }
}
