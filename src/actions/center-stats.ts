"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type StatsPeriod = "30d" | "90d" | "12m" | "all";

interface MonthlyData {
  month: string;
  label: string;
  bookingAmount: number;
  centerAmount: number;
  commissionAmount: number;
}

interface BookingStatusCount {
  status: string;
  count: number;
}

interface TopService {
  serviceId: string;
  serviceName: string;
  count: number;
  revenue: number;
}

interface MonthlyReview {
  month: string;
  label: string;
  count: number;
  avgRating: number;
}

interface MonthlyBooking {
  month: string;
  label: string;
  count: number;
}

export interface CenterStatsData {
  // Revenus
  revenueByMonth: MonthlyData[];
  totalRevenueBrut: number;
  totalRevenueNet: number;
  previousPeriodRevenueBrut: number;
  previousPeriodRevenueNet: number;
  revenueEvolution: number;
  
  // Réservations
  bookingsByMonth: MonthlyBooking[];
  bookingsByStatus: BookingStatusCount[];
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  confirmationRate: number;
  cancellationRate: number;
  previousPeriodBookings: number;
  bookingsEvolution: number;
  
  // Top services
  topServices: TopService[];
  
  // Clients
  totalClients: number;
  newClients: number;
  returningClients: number;
  previousPeriodClients: number;
  clientsEvolution: number;
  returnRate: number;
  
  // Avis
  reviewsByMonth: MonthlyReview[];
  totalReviews: number;
  averageRating: number;
  previousPeriodReviews: number;
  reviewsEvolution: number;
  
  // Période
  periodStart: Date;
  periodEnd: Date;
}

function getDateRange(period: StatsPeriod): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start: Date;
  let previousStart: Date;
  let previousEnd: Date;
  
  switch (period) {
    case "30d":
      start = new Date(end);
      start.setDate(start.getDate() - 30);
      previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 30);
      break;
    case "90d":
      start = new Date(end);
      start.setDate(start.getDate() - 90);
      previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 90);
      break;
    case "12m":
      start = new Date(end);
      start.setMonth(start.getMonth() - 12);
      previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setMonth(previousStart.getMonth() - 12);
      break;
    case "all":
    default:
      start = new Date(2020, 0, 1);
      previousEnd = new Date(start);
      previousStart = new Date(2019, 0, 1);
      break;
  }
  
  return { start, end, previousStart, previousEnd };
}

function formatMonthLabel(date: Date, locale: string = "fr"): string {
  return date.toLocaleDateString(locale, { month: "short", year: "2-digit" });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getCenterStats(
  period: StatsPeriod = "12m",
  locale: string = "fr"
): Promise<{ success: boolean; data?: CenterStatsData; error?: string }> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    
    if (session.user.userType !== "CENTER_OWNER" && session.user.userType !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }
    
    // Find user's center
    const center = await prisma.diveCenter.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    
    if (!center) {
      return { success: false, error: "No center found" };
    }
    
    const { start, end, previousStart, previousEnd } = getDateRange(period);
    
    // ============================================
    // 1. REVENUS
    // ============================================
    
    // Commissions de la période actuelle
    const commissions = await prisma.commission.findMany({
      where: {
        centerId: center.id,
        createdAt: { gte: start, lte: end },
      },
      select: {
        bookingAmount: true,
        centerAmount: true,
        commissionAmount: true,
        createdAt: true,
      },
    });
    
    // Commissions de la période précédente
    const previousCommissions = await prisma.commission.findMany({
      where: {
        centerId: center.id,
        createdAt: { gte: previousStart, lte: previousEnd },
      },
      select: {
        bookingAmount: true,
        centerAmount: true,
      },
    });
    
    // Agrégation par mois pour les graphiques
    const revenueByMonthMap = new Map<string, MonthlyData>();
    
    // Initialiser tous les mois de la période
    const currentMonth = new Date(start);
    while (currentMonth <= end) {
      const key = getMonthKey(currentMonth);
      revenueByMonthMap.set(key, {
        month: key,
        label: formatMonthLabel(currentMonth, locale),
        bookingAmount: 0,
        centerAmount: 0,
        commissionAmount: 0,
      });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    // Remplir avec les données
    let totalRevenueBrut = 0;
    let totalRevenueNet = 0;
    
    for (const comm of commissions) {
      const key = getMonthKey(comm.createdAt);
      const existing = revenueByMonthMap.get(key);
      const bookingAmount = Number(comm.bookingAmount);
      const centerAmount = Number(comm.centerAmount);
      const commissionAmount = Number(comm.commissionAmount);
      
      if (existing) {
        existing.bookingAmount += bookingAmount;
        existing.centerAmount += centerAmount;
        existing.commissionAmount += commissionAmount;
      }
      
      totalRevenueBrut += bookingAmount;
      totalRevenueNet += centerAmount;
    }
    
    // Période précédente
    let previousPeriodRevenueBrut = 0;
    let previousPeriodRevenueNet = 0;
    
    for (const comm of previousCommissions) {
      previousPeriodRevenueBrut += Number(comm.bookingAmount);
      previousPeriodRevenueNet += Number(comm.centerAmount);
    }
    
    const revenueEvolution = previousPeriodRevenueNet > 0
      ? ((totalRevenueNet - previousPeriodRevenueNet) / previousPeriodRevenueNet) * 100
      : totalRevenueNet > 0 ? 100 : 0;
    
    // ============================================
    // 2. RÉSERVATIONS
    // ============================================
    
    // Réservations de la période actuelle
    const bookings = await prisma.booking.findMany({
      where: {
        centerId: center.id,
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        serviceId: true,
        totalPrice: true,
        userId: true,
        service: {
          select: {
            name: true,
          },
        },
      },
    });
    
    // Réservations période précédente
    const previousBookingsCount = await prisma.booking.count({
      where: {
        centerId: center.id,
        createdAt: { gte: previousStart, lte: previousEnd },
      },
    });
    
    // Agrégation par mois
    const bookingsByMonthMap = new Map<string, MonthlyBooking>();
    const monthInit = new Date(start);
    while (monthInit <= end) {
      const key = getMonthKey(monthInit);
      bookingsByMonthMap.set(key, {
        month: key,
        label: formatMonthLabel(monthInit, locale),
        count: 0,
      });
      monthInit.setMonth(monthInit.getMonth() + 1);
    }
    
    // Compteurs de status
    const statusCounts = new Map<string, number>();
    const serviceStats = new Map<string, { count: number; revenue: number; name: unknown }>();
    const clientIds = new Set<string>();
    
    for (const booking of bookings) {
      // Par mois
      const key = getMonthKey(booking.createdAt);
      const existing = bookingsByMonthMap.get(key);
      if (existing) {
        existing.count++;
      }
      
      // Par status
      statusCounts.set(booking.status, (statusCounts.get(booking.status) || 0) + 1);
      
      // Par service
      const serviceStat = serviceStats.get(booking.serviceId) || { 
        count: 0, 
        revenue: 0, 
        name: booking.service.name 
      };
      serviceStat.count++;
      serviceStat.revenue += Number(booking.totalPrice);
      serviceStats.set(booking.serviceId, serviceStat);
      
      // Clients uniques
      if (booking.userId) {
        clientIds.add(booking.userId);
      }
    }
    
    const totalBookings = bookings.length;
    const confirmedBookings = (statusCounts.get("CONFIRMED") || 0) + 
                              (statusCounts.get("PAID") || 0) + 
                              (statusCounts.get("COMPLETED") || 0);
    const cancelledBookings = statusCounts.get("CANCELLED") || 0;
    const confirmationRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
    const bookingsEvolution = previousBookingsCount > 0
      ? ((totalBookings - previousBookingsCount) / previousBookingsCount) * 100
      : totalBookings > 0 ? 100 : 0;
    
    // Top services
    const getLocalizedName = (name: unknown): string => {
      if (typeof name === "object" && name !== null) {
        const obj = name as Record<string, unknown>;
        return String(obj[locale] || obj.fr || obj.en || "Service");
      }
      return "Service";
    };
    
    const topServices: TopService[] = Array.from(serviceStats.entries())
      .map(([serviceId, stats]) => ({
        serviceId,
        serviceName: getLocalizedName(stats.name),
        count: stats.count,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // ============================================
    // 3. CLIENTS
    // ============================================
    
    const totalClients = clientIds.size;
    
    // Clients qui ont déjà réservé avant cette période
    const returningClientIds = await prisma.booking.findMany({
      where: {
        centerId: center.id,
        userId: { in: Array.from(clientIds) },
        createdAt: { lt: start },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    
    const returningClients = returningClientIds.length;
    const newClients = totalClients - returningClients;
    const returnRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;
    
    // Clients période précédente
    const previousClientsResult = await prisma.booking.findMany({
      where: {
        centerId: center.id,
        createdAt: { gte: previousStart, lte: previousEnd },
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    const previousPeriodClients = previousClientsResult.length;
    
    const clientsEvolution = previousPeriodClients > 0
      ? ((totalClients - previousPeriodClients) / previousPeriodClients) * 100
      : totalClients > 0 ? 100 : 0;
    
    // ============================================
    // 4. AVIS
    // ============================================
    
    const reviews = await prisma.review.findMany({
      where: {
        centerId: center.id,
        createdAt: { gte: start, lte: end },
        status: "APPROVED",
      },
      select: {
        rating: true,
        createdAt: true,
      },
    });
    
    // Période précédente
    const previousReviewsCount = await prisma.review.count({
      where: {
        centerId: center.id,
        createdAt: { gte: previousStart, lte: previousEnd },
        status: "APPROVED",
      },
    });
    
    // Par mois
    const reviewsByMonthMap = new Map<string, { count: number; totalRating: number }>();
    const reviewMonthInit = new Date(start);
    while (reviewMonthInit <= end) {
      const key = getMonthKey(reviewMonthInit);
      reviewsByMonthMap.set(key, { count: 0, totalRating: 0 });
      reviewMonthInit.setMonth(reviewMonthInit.getMonth() + 1);
    }
    
    let totalRating = 0;
    for (const review of reviews) {
      const key = getMonthKey(review.createdAt);
      const existing = reviewsByMonthMap.get(key);
      if (existing) {
        existing.count++;
        existing.totalRating += review.rating;
      }
      totalRating += review.rating;
    }
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    const reviewsEvolution = previousReviewsCount > 0
      ? ((totalReviews - previousReviewsCount) / previousReviewsCount) * 100
      : totalReviews > 0 ? 100 : 0;
    
    // Conversion en tableau
    const reviewsByMonth: MonthlyReview[] = [];
    const reviewMonthKeys = Array.from(reviewsByMonthMap.keys()).sort();
    for (const key of reviewMonthKeys) {
      const data = reviewsByMonthMap.get(key)!;
      const [year, month] = key.split("-").map(Number);
      const date = new Date(year, month - 1);
      reviewsByMonth.push({
        month: key,
        label: formatMonthLabel(date, locale),
        count: data.count,
        avgRating: data.count > 0 ? data.totalRating / data.count : 0,
      });
    }
    
    // ============================================
    // RÉSULTAT FINAL
    // ============================================
    
    const statsData: CenterStatsData = {
      // Revenus
      revenueByMonth: Array.from(revenueByMonthMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
      totalRevenueBrut,
      totalRevenueNet,
      previousPeriodRevenueBrut,
      previousPeriodRevenueNet,
      revenueEvolution,
      
      // Réservations
      bookingsByMonth: Array.from(bookingsByMonthMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
      bookingsByStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      confirmationRate,
      cancellationRate,
      previousPeriodBookings: previousBookingsCount,
      bookingsEvolution,
      
      // Top services
      topServices,
      
      // Clients
      totalClients,
      newClients,
      returningClients,
      previousPeriodClients,
      clientsEvolution,
      returnRate,
      
      // Avis
      reviewsByMonth,
      totalReviews,
      averageRating,
      previousPeriodReviews: previousReviewsCount,
      reviewsEvolution,
      
      // Période
      periodStart: start,
      periodEnd: end,
    };
    
    return { success: true, data: statsData };
  } catch (error) {
    console.error("Error fetching center stats:", error);
    return { success: false, error: "An error occurred while fetching stats" };
  }
}
