import { redirect, notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { ServiceForm } from "@/components/center/services/ServiceForm";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { updateService } from "../../actions";
import type { Decimal } from "@prisma/client/runtime/library";

type LocalizedJson = {
  fr?: string;
  en?: string;
  es?: string;
  it?: string;
  de?: string;
};

interface ServiceExtra {
  id: string;
  name: unknown;
  description: unknown;
  price: Decimal;
  multiplyByPax: boolean;
  isRequired: boolean;
  isActive: boolean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "centerServices" });

  // Fetch service name for title
  const service = await prisma.diveService.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!service) {
    return {
      title: t("errors.not_found"),
    };
  }

  const serviceName = service.name as LocalizedJson;
  const displayName = serviceName[locale as keyof LocalizedJson] || serviceName.fr || serviceName.en || "";

  return {
    title: `${t("editService")} - ${displayName}`,
    description: t("meta.description"),
  };
}

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
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

  // Fetch the service with extras
  const service = await prisma.diveService.findFirst({
    where: {
      id,
      centerId: center.id,
    },
    include: {
      extras: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!service) {
    notFound();
  }

  // Fetch all categories for the form
  const categories = await prisma.diveCategory.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name as LocalizedJson,
  }));

  // Serialize the service data
  const serializedService = {
    id: service.id,
    name: service.name as LocalizedJson,
    description: service.description as LocalizedJson | undefined,
    categoryId: service.categoryId,
    price: Number(service.price),
    currency: service.currency,
    pricePerPerson: service.pricePerPerson,
    durationMinutes: service.durationMinutes,
    minParticipants: service.minParticipants,
    maxParticipants: service.maxParticipants,
    minCertification: service.minCertification,
    minAge: service.minAge,
    maxDepth: service.maxDepth,
    equipmentIncluded: service.equipmentIncluded,
    equipmentDetails: service.equipmentDetails,
    includes: service.includes,
    photos: service.photos,
    availableDays: service.availableDays,
    startTimes: service.startTimes,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extras: ((service as any).extras as ServiceExtra[]).map((e) => ({
      id: e.id,
      name: e.name as LocalizedJson,
      description: e.description as LocalizedJson | undefined,
      price: Number(e.price),
      multiplyByPax: e.multiplyByPax,
      isRequired: e.isRequired,
      isActive: e.isActive,
    })),
  };

  // Prepare translations for the form
  const formTranslations = {
    title: t("form.title"),
    basicInfo: t("form.basicInfo"),
    pricing: t("form.pricing"),
    capacity: t("form.capacity"),
    schedule: t("form.schedule"),
    media: t("form.media"),
    extras: t("form.extras"),
    name: t("form.name"),
    nameFr: t("form.nameFr"),
    nameEn: t("form.nameEn"),
    namePlaceholder: t("form.namePlaceholder"),
    description: t("form.description"),
    descriptionFr: t("form.descriptionFr"),
    descriptionEn: t("form.descriptionEn"),
    descriptionPlaceholder: t("form.descriptionPlaceholder"),
    category: t("form.category"),
    selectCategory: t("form.selectCategory"),
    price: t("form.price"),
    currency: t("form.currency"),
    pricePerPerson: t("form.pricePerPerson"),
    duration: t("form.duration"),
    minParticipants: t("form.minParticipants"),
    maxParticipants: t("form.maxParticipants"),
    minCertification: t("form.minCertification"),
    noCertification: t("form.noCertification"),
    minAge: t("form.minAge"),
    maxDepth: t("form.maxDepth"),
    equipmentIncluded: t("form.equipmentIncluded"),
    equipmentDetails: t("form.equipmentDetails"),
    equipmentDetailsPlaceholder: t("form.equipmentDetailsPlaceholder"),
    includes: t("form.includes"),
    includesPlaceholder: t("form.includesPlaceholder"),
    availableDays: t("form.availableDays"),
    startTimes: t("form.startTimes"),
    addTime: t("form.addTime"),
    photos: t("form.photos"),
    addPhoto: t("form.addPhoto"),
    submit: t("form.submit"),
    creating: t("form.creating"),
    updating: t("form.updating"),
    success: t("form.success"),
    error: t("form.error"),
  };

  const daysTranslations = {
    monday: t("days.monday"),
    tuesday: t("days.tuesday"),
    wednesday: t("days.wednesday"),
    thursday: t("days.thursday"),
    friday: t("days.friday"),
    saturday: t("days.saturday"),
    sunday: t("days.sunday"),
  };

  const certificationsTranslations = {
    none: t("certifications.none"),
    ow: t("certifications.ow"),
    aow: t("certifications.aow"),
    rescue: t("certifications.rescue"),
    dm: t("certifications.dm"),
    instructor: t("certifications.instructor"),
  };

  // Get localized service name for display
  const serviceName = service.name as LocalizedJson;
  const displayName = serviceName[locale as keyof LocalizedJson] || serviceName.fr || serviceName.en || "";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/center/services"
            className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("backToServices")}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t("editService")}</h1>
          <p className="mt-1 text-white/60">
            {displayName}
          </p>
        </div>

        {/* Form */}
        <ServiceForm
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          service={serializedService as any}
          categories={serializedCategories}
          locale={locale}
          translations={formTranslations}
          daysTranslations={daysTranslations}
          certificationsTranslations={certificationsTranslations}
          onSubmit={updateService}
        />
      </div>
    </div>
  );
}
