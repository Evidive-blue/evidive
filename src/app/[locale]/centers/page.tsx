import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { CentersGlobe, type CenterGlobePoint } from "@/components/centers/centers-globe";

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

function decimalToNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centers" });

  return {
    title: t("directory.meta.title"),
    description: t("directory.meta.description"),
    openGraph: {
      title: t("directory.meta.title"),
      description: t("directory.meta.description"),
    },
  };
}

export default async function CentersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centers" });

  const centers = await prisma.diveCenter.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ featured: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
    select: {
      slug: true,
      name: true,
      shortDescription: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      featuredImage: true,
      verified: true,
      rating: true,
      reviewCount: true,
    },
    take: 200,
  });

  const globePoints: CenterGlobePoint[] = centers
    .map((center): CenterGlobePoint | null => {
      const label = getLocalizedText(center.name, locale);
      if (!label) return null;

      const description =
        getLocalizedText(center.shortDescription, locale) ||
        getLocalizedText(center.name, locale);

      const regionLabel = [center.city, center.country].filter(Boolean).join(", ");

      return {
        slug: center.slug,
        lat: decimalToNumber(center.latitude),
        lng: decimalToNumber(center.longitude),
        label,
        regionLabel,
        description,
        color: center.verified ? "#22d3ee" : "#0ea5e9",
      };
    })
    .filter((p): p is CenterGlobePoint => p !== null);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            {t("directory.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-white/60">
            {t("directory.subtitle")}
          </p>
        </div>

        <CentersGlobe locale={locale} points={globePoints} />

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white">
            {t("directory.listTitle")}
          </h2>

          {centers.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70 backdrop-blur-xl">
              <div className="text-2xl font-semibold text-white">
                {t("directory.emptyTitle")}
              </div>
              <div className="mx-auto mt-2 max-w-2xl text-sm text-white/60">
                {t("directory.emptyDescription")}
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {centers.map((center) => {
                const name = getLocalizedText(center.name, locale);
                const desc = getLocalizedText(center.shortDescription, locale);
                const location = [center.city, center.country].filter(Boolean).join(", ");

                return (
                  <Link
                    key={center.slug}
                    href={`/center/${center.slug}`}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:border-cyan-500/30"
                  >
                    <div className="relative h-40 w-full bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-white group-hover:text-cyan-200 transition-colors">
                            {name}
                          </div>
                          <div className="mt-1 text-sm text-white/60">{location}</div>
                        </div>
                        {center.verified ? (
                          <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                            {t("directory.verified")}
                          </span>
                        ) : null}
                      </div>

                      {desc ? (
                        <p className="mt-4 line-clamp-3 text-sm text-white/70">
                          {desc}
                        </p>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="text-white/60">
                          {t("directory.rating", {
                            rating: Number(center.rating),
                            count: center.reviewCount,
                          })}
                        </div>
                        <div className="text-cyan-300/80 group-hover:text-cyan-200 transition-colors">
                          {t("directory.viewCenter")}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

