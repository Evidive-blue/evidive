import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function decimalToNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    const toNumber = (value as { toNumber?: unknown }).toNumber;
    if (typeof toNumber === "function") {
      return (toNumber as () => number)();
    }
  }
  return 0;
}

export default async function SellerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations({ locale, namespace: "dashboard.seller" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Same rights as diver; just different dashboard view.
  if (session.user.userType !== "SELLER" && session.user.userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Optional: show seller "virtual center" if it exists (created by seller onboarding)
  const sellerCenter = await prisma.diveCenter.findUnique({
    where: { slug: `seller-${session.user.id}` },
    select: {
      id: true,
      slug: true,
      status: true,
      createdAt: true,
      stripeAccountId: true,
      services: {
        select: {
          id: true,
          price: true,
          currency: true,
          durationMinutes: true,
          name: true,
        },
        take: 10,
      },
    },
  });

  const today = normalizeDateOnly(new Date());

  const [upcomingBookingsCount, pendingCommissionSum] = sellerCenter
    ? await Promise.all([
        prisma.booking.count({
          where: {
            centerId: sellerCenter.id,
            diveDate: { gte: today },
            status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
          },
        }),
        prisma.commission.aggregate({
          where: { centerId: sellerCenter.id, status: "PENDING" },
          _sum: { centerAmount: true },
        }),
      ])
    : [0, { _sum: { centerAmount: null } }];

  const pendingPayoutAmount = decimalToNumber(pendingCommissionSum._sum.centerAmount);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
            <p className="mt-2 text-white/60">
              {t("description")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10"
            >
{t("diverView")}
            </Link>
            <Link
              href="/profile"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10"
            >
{t("profile")}
            </Link>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 backdrop-blur-xl">
            <div className="text-lg font-semibold text-white">{t("title")}</div>
            <div className="mt-1 text-sm text-white/60">
              {t("subtitle")}
            </div>
          </div>

          {sellerCenter ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white">{t("sellerCenter")}</div>
                  <div className="mt-1 text-sm text-white/60">
                    {t("status")}: <span className="text-white/80">{sellerCenter.status}</span>
                  </div>
                </div>
                {session.user.userType === "ADMIN" ? (
                  <Link
                    href="/admin/centers"
                    className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
                  >
                    {t("adminValidateCenters")}
                  </Link>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">{t("kpis.services")}</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{sellerCenter.services.length}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">{t("kpis.upcomingBookings")}</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{upcomingBookingsCount}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">{t("kpis.pendingPayout")}</div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    {pendingPayoutAmount.toFixed(2)} EUR
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold text-white/80">
                  {t("services")}
                </div>
                {sellerCenter.services.length === 0 ? (
                  <div className="mt-2 text-sm text-white/60">
                    {t("noServices")}
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {sellerCenter.services.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div className="text-sm font-medium text-white">
                          {(s.name as { fr?: string; en?: string })?.fr ?? (s.name as { fr?: string; en?: string })?.en ?? t("service")}
                        </div>
                        <div className="text-sm text-white/70">
                          {Number(s.price)} {s.currency} • {s.durationMinutes} min
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 backdrop-blur-xl">
              {t("noSellerCenter")}{" "}
              <Link href="/onboard/seller" className="text-cyan-300 hover:text-cyan-200 underline">
                {t("sellerOnboarding")}
              </Link>
              .
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

