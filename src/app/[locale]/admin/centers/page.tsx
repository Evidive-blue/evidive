import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { approveCenter, rejectCenter } from "./actions";
import { auth } from "@/lib/auth";

type LocalizedJson = Record<string, unknown>;

function getLocalizedText(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";

  const obj = value as LocalizedJson;
  const direct = obj[locale];
  if (typeof direct === "string" && direct.trim().length > 0) return direct;

  const fallback = obj.en;
  if (typeof fallback === "string" && fallback.trim().length > 0) return fallback;

  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }

  return "";
}

export default async function AdminCentersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminCenters" });

  const session = await auth();
  const isAuthorized = session?.user?.userType === "ADMIN";

  const pendingCenters = isAuthorized
    ? await prisma.diveCenter.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          country: true,
          email: true,
          phone: true,
          createdAt: true,
        },
        take: 200,
      })
    : [];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
            <p className="mt-2 text-white/60">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/centers"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← {t("backToCenters")}
          </Link>
        </div>

        {!isAuthorized ? (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
            <div className="font-semibold">{t("accessDeniedTitle")}</div>
            <div className="mt-1 text-sm opacity-90">
              {t("accessDeniedDesc")}
            </div>
          </div>
        ) : null}

        {isAuthorized ? (
          <div className="mt-10">
          <h2 className="text-lg font-semibold text-white">
            {t("pendingTitle")} ({pendingCenters.length})
          </h2>

          {pendingCenters.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70 backdrop-blur-xl">
              {t("nonePending")}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {pendingCenters.map((center) => {
                const name = getLocalizedText(center.name, locale) || center.slug;
                const location = [center.city, center.country].filter(Boolean).join(", ");

                return (
                  <div
                    key={center.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-semibold text-white">{name}</div>
                        <div className="mt-1 text-sm text-white/60">{location}</div>
                        <div className="mt-3 grid gap-1 text-sm text-white/70">
                          <div>
                            {t("email")}: {center.email}
                          </div>
                          <div>
                            {t("phone")}: {center.phone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <form action={approveCenter}>
                          <input type="hidden" name="centerId" value={center.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <button
                            type="submit"
                            disabled={!isAuthorized}
                            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
                          >
                            {t("approve")}
                          </button>
                        </form>

                        <form action={rejectCenter}>
                          <input type="hidden" name="centerId" value={center.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <button
                            type="submit"
                            disabled={!isAuthorized}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                          >
                            {t("reject")}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

