import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint for database connection verification
 * GET /api/health
 * 
 * Returns:
 * - status: "ok" | "error"
 * - database: "connected" | "disconnected"
 * - counts: table row counts for verification
 * - latency: query execution time in ms
 */

type HealthResponse = {
  status: "ok" | "error";
  database: "connected" | "disconnected";
  timestamp: string;
  latency?: number;
  counts?: {
    profiles: number;
    diveCenters: number;
    diveServices: number;
    bookings: number;
  };
  error?: string;
  prismaAccelerate: boolean;
};

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Check if using Prisma Accelerate
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isPrismaAccelerate = databaseUrl.startsWith("prisma+postgres://");

  try {
    // Run multiple queries in parallel to test connection thoroughly
    const [profileCount, diveCenterCount, diveServiceCount, bookingCount] = await Promise.all([
      prisma.profile.count(),
      prisma.diveCenter.count(),
      prisma.diveService.count(),
      prisma.booking.count(),
    ]);

    const latency = Date.now() - startTime;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp,
      latency,
      counts: {
        profiles: profileCount,
        diveCenters: diveCenterCount,
        diveServices: diveServiceCount,
        bookings: bookingCount,
      },
      prismaAccelerate: isPrismaAccelerate,
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";

    console.error("[Health Check] Database connection failed:", errorMessage);

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        timestamp,
        latency,
        error: errorMessage,
        prismaAccelerate: isPrismaAccelerate,
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD request for simple uptime checks
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    // Quick ping query
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
