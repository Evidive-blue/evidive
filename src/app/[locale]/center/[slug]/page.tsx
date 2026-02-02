import type { Metadata } from "next";
import type { Decimal } from "@prisma/client/runtime/library";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

type LocalizedJson = Record<string, unknown>;

// Service type for Prisma Accelerate compatibility
type CenterService = {
  id: string;
  name: unknown;
  description: unknown;
  price: Decimal;
  durationMinutes: number;
  maxParticipants: number;
  minCertification: string | null;
};

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "centers" });

  const center = await prisma.diveCenter.findUnique({
    where: { slug },
    select: { name: true, shortDescription: true },
  });

  if (!center) return { title: t("directory.meta.title") };

  const name = getLocalizedText(center.name, locale);
  const description = getLocalizedText(center.shortDescription, locale);

  return {
    title: name || t("directory.meta.title"),
    description: description || t("directory.meta.description"),
    openGraph: {
      title: name || t("directory.meta.title"),
      description: description || t("directory.meta.description"),
    },
  };
}

export default async function CenterPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "centers" });

  const center = await prisma.diveCenter.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      description: true,
      city: true,
      country: true,
      verified: true,
      status: true,
      rating: true,
      reviewCount: true,
      services: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          durationMinutes: true,
          maxParticipants: true,
          minCertification: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!center) notFound();

  // Only show approved centers publicly
  if (center.status !== "APPROVED") notFound();

  const name = getLocalizedText(center.name, locale);
  const description = getLocalizedText(center.description, locale);
  const location = [center.city, center.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/centers"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          ← {t("directory.backToCenters")}
        </Link>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{name}</h1>
              <p className="mt-2 text-white/60">{location}</p>
            </div>
            {center.verified ? (
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                {t("directory.verified")}
              </span>
            ) : null}
          </div>

          {description ? (
            <p className="mt-6 text-white/70 leading-relaxed">{description}</p>
          ) : null}

          <div className="mt-6 text-sm text-white/60">
            {t("directory.rating", {
              rating: Number(center.rating),
              count: center.reviewCount,
            })}
          </div>
        </div>

        {/* Services Section */}
        {(center as unknown as { services?: CenterService[] }).services && (center as unknown as { services?: CenterService[] }).services!.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-6">{t("directory.services")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(center as unknown as { services: CenterService[] }).services.map((service: CenterService) => {
                const serviceName = getLocalizedText(service.name, locale);
                const serviceDescription = getLocalizedText(service.description, locale);
                return (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                  >
                    <h3 className="text-lg font-semibold text-white">{serviceName}</h3>
                    {serviceDescription && (
                      <p className="mt-2 text-sm text-white/60 line-clamp-2">{serviceDescription}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-cyan-400 font-medium">
                        {Number(service.price).toLocaleString(locale, { style: "currency", currency: "CHF" })}
                      </span>
                      {service.durationMinutes && (
                        <span className="text-white/50">
                          {service.durationMinutes} {t("directory.minutes")}
                        </span>
                      )}
                      {service.maxParticipants && (
                        <span className="text-white/50">
                          {t("directory.maxParticipants", { count: service.maxParticipants })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

