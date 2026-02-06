import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { BookingStatus, Prisma } from "@prisma/client";

// GET - List all bookings (admin only)
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
    const statusParam = searchParams.get("status"); // PENDING, CONFIRMED, COMPLETED, CANCELLED
    const centerId = searchParams.get("centerId");
    const diverId = searchParams.get("diverId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: Prisma.BookingWhereInput = {};
    
    if (statusParam) {
      where.status = statusParam as BookingStatus;
    }
    
    if (centerId) {
      where.centerId = centerId;
    }
    
    if (diverId) {
      where.diverId = diverId;
    }
    
    if (dateFrom || dateTo) {
      where.diveDate = {};
      if (dateFrom) {
        where.diveDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.diveDate.lte = new Date(dateTo);
      }
    }

    const [bookings, total, stats] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          reference: true,
          diveDate: true,
          diveTime: true,
          participants: true,
          totalPrice: true,
          status: true,
          paymentStatus: true,
          specialRequests: true,
          createdAt: true,
          center: {
            select: {
              id: true,
              slug: true,
              name: true,
              city: true,
              country: true,
            },
          },
          diver: {
            select: {
              id: true,
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
      // Get stats
      prisma.booking.groupBy({
        by: ["status"],
        _count: true,
        _sum: { totalPrice: true },
      }),
    ]);

    // Calculate total revenue
    const totalRevenue = stats.reduce((acc, s) => acc + Number(s._sum.totalPrice || 0), 0);
    const statusCounts = Object.fromEntries(
      stats.map(s => [s.status, s._count])
    );

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalRevenue,
        statusCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
