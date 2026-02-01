import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { ServicesListClient } from "./services-list-client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerServices" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerServices" });

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Check if user is CENTER_OWNER or ADMIN
  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Find the user's center
  const center = await prisma.diveCenter.findFirst({
    where: { ownerId: session.user.id, status: "APPROVED" },
    select: { id: true, name: true },
  });

  if (!center) {
    redirect(`/${locale}/center`);
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

  // Prepare translations for client
  const translations = {
    title: t("title"),
    subtitle: t("subtitle"),
    newService: t("newService"),
    backToCenter: t("backToServices"),
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
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/center"
              className="mb-2 inline-flex items-center text-sm text-white/60 hover:text-white"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Retour au tableau de bord
            </Link>
            <h1 className="text-3xl font-bold text-white">{translations.title}</h1>
            <p className="mt-1 text-white/60">{translations.subtitle}</p>
          </div>
          <Link href={`/${locale}/center/services/new`}>
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
        />
      </div>
    </div>
  );
}
