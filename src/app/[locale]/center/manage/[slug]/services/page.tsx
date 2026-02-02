import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { ServicesListClient } from "@/app/[locale]/center/services/services-list-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import type { Decimal } from "@prisma/client/runtime/library";

type LocalizedJson = Record<string, unknown>;

interface ServiceWithRelations {
  id: string;
  name: unknown;
  description: unknown;
  price: Decimal;
  currency: string;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  minCertification: string | null;
  equipmentIncluded: boolean;
  isActive: boolean;
  category: {
    id: string;
    slug: string;
    name: unknown;
  } | null;
  _count: {
    extras: number;
  };
}

function getLocalizedText(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as LocalizedJson;
  const direct = obj[locale];
  if (typeof direct === "string" && direct.trim().length > 0) return direct;
  const fallback = obj.fr;
  if (typeof fallback === "string" && fallback.trim().length > 0) return fallback;
  const en = obj.en;
  if (typeof en === "string" && en.trim().length > 0) return en;
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
  const t = await getTranslations({ locale, namespace: "centerServices" });

  const center = await prisma.diveCenter.findUnique({
    where: { slug },
    select: { name: true },
  });

  const centerName = center ? getLocalizedText(center.name, locale) : "";

  return {
    title: centerName ? `${t("meta.title")} - ${centerName}` : t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterManageServicesPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerServices" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Get center by slug
  const center = await prisma.diveCenter.findUnique({
    where: { slug },
    select: { id: true, name: true, status: true, ownerId: true },
  });

  if (!center) {
    notFound();
  }

  // Verify ownership (ADMIN can access any center)
  if (userType !== "ADMIN" && center.ownerId !== session.user.id) {
    redirect(`/${locale}/dashboard`);
  }

  if (center.status !== "APPROVED") {
    redirect(`/${locale}/center/manage/${slug}`);
  }

  // Fetch all services for this center
  const services = await prisma.diveService.findMany({
    where: { centerId: center.id },
    include: {
      category: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      _count: {
        select: { extras: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all categories for filtering
  const categories = await prisma.diveCategory.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  // Serialize services for client component
  const serializedServices = (services as unknown as ServiceWithRelations[]).map((s) => ({
    id: s.id,
    name: s.name as LocalizedJson,
    description: s.description as LocalizedJson | undefined,
    price: Number(s.price),
    currency: s.currency,
    durationMinutes: s.durationMinutes,
    minParticipants: s.minParticipants,
    maxParticipants: s.maxParticipants,
    minCertification: s.minCertification,
    equipmentIncluded: s.equipmentIncluded,
    isActive: s.isActive,
    category: s.category
      ? {
          id: s.category.id,
          slug: s.category.slug,
          name: s.category.name as LocalizedJson,
        }
      : null,
    _count: s._count,
  }));

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name as LocalizedJson,
  }));

  const centerName = getLocalizedText(center.name, locale) || "Mon centre";
  const basePath = `/center/manage/${slug}`;

  // Prepare translations for client
  const translations = {
    title: t("title"),
    subtitle: t("subtitle"),
    newService: t("newService"),
    backToCenter: t("backToServices"),
    basePath,
    filters: {
      all: t("filters.all"),
      active: t("filters.active"),
      archived: t("filters.archived"),
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
    },
    card: {
      edit: t("editService"),
      duplicate: t("duplicateService"),
      archive: t("archiveService"),
      activate: t("activateService"),
      delete: t("deleteService"),
      price: t("card.price"),
      duration: t("card.duration"),
      participants: t("card.participants"),
      certification: t("card.certification"),
      extras: t("card.extras"),
      active: t("card.active"),
      archived: t("card.archived"),
      equipmentIncluded: t("card.equipmentIncluded"),
      confirmArchiveTitle: t("confirmArchive.title"),
      confirmArchiveDescription: t("confirmArchive.description"),
      confirmDeleteTitle: t("confirmDelete.title"),
      confirmDeleteDescription: t("confirmDelete.description"),
      cancel: t("confirmArchive.cancel"),
    },
    certifications: {
      none: t("certifications.none"),
      ow: t("certifications.ow"),
      aow: t("certifications.aow"),
      rescue: t("certifications.rescue"),
      dm: t("certifications.dm"),
      instructor: t("certifications.instructor"),
    },
  };

  return (
    <div className="pt-8 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{translations.title}</h1>
            <p className="mt-1 text-white/60">{t("subtitle", { centerName })}</p>
          </div>
          <Link href={`${basePath}/services/new`}>
            <Button className="bg-cyan-600 text-white hover:bg-cyan-700">
              <Plus className="mr-2 h-4 w-4" />
              {translations.newService}
            </Button>
          </Link>
        </div>

        {/* Services List */}
        <ServicesListClient
          services={serializedServices}
          categories={serializedCategories}
          locale={locale}
          translations={translations}
          basePath={basePath}
        />
      </div>
    </div>
  );
}
