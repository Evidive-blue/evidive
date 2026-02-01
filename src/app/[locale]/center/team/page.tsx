import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { TeamListClient } from "./team-list-client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerTeam" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterTeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerTeam" });

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

  // Fetch all workers for this center
  const workers = await prisma.centerWorker.findMany({
    where: { centerId: center.id },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: [
      { isDefault: "desc" }, // Owner first
      { createdAt: "asc" },
    ],
  });

  // Serialize workers for client component
  const serializedWorkers = workers.map((w) => ({
    id: w.id,
    name: w.name,
    email: w.email,
    phone: w.phone,
    photoUrl: w.photoUrl,
    bio: w.bio,
    certifications: w.certifications,
    languages: w.languages,
    isDefault: w.isDefault,
    isActive: w.isActive,
    _count: w._count,
  }));

  // Prepare translations for client
  const translations = {
    title: t("title"),
    subtitle: t("subtitle"),
    addMember: t("addMember"),
    backToCenter: t("backToCenter"),
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
    },
    card: {
      edit: t("card.edit"),
      deactivate: t("card.deactivate"),
      reactivate: t("card.reactivate"),
      delete: t("card.delete"),
      owner: t("card.owner"),
      active: t("card.active"),
      inactive: t("card.inactive"),
      noCertifications: t("card.noCertifications"),
      noLanguages: t("card.noLanguages"),
      confirmDeactivateTitle: t("card.confirmDeactivateTitle"),
      confirmDeactivateDescription: t("card.confirmDeactivateDescription"),
      confirmDeleteTitle: t("card.confirmDeleteTitle"),
      confirmDeleteDescription: t("card.confirmDeleteDescription"),
      cannotDeleteWithBookings: t("card.cannotDeleteWithBookings"),
      cancel: t("card.cancel"),
    },
    form: {
      createTitle: t("form.createTitle"),
      editTitle: t("form.editTitle"),
      createDescription: t("form.createDescription"),
      editDescription: t("form.editDescription"),
      name: t("form.name"),
      namePlaceholder: t("form.namePlaceholder"),
      email: t("form.email"),
      emailPlaceholder: t("form.emailPlaceholder"),
      phone: t("form.phone"),
      phonePlaceholder: t("form.phonePlaceholder"),
      photo: t("form.photo"),
      photoHint: t("form.photoHint"),
      bio: t("form.bio"),
      bioPlaceholder: t("form.bioPlaceholder"),
      certifications: t("form.certifications"),
      languages: t("form.languages"),
      cancel: t("form.cancel"),
      save: t("form.save"),
      saving: t("form.saving"),
      create: t("form.create"),
      creating: t("form.creating"),
      optional: t("form.optional"),
      errors: {
        nameRequired: t("form.errors.nameRequired"),
        emailInvalid: t("form.errors.emailInvalid"),
        generic: t("form.errors.generic"),
      },
    },
    certifications: {
      ow: t("certifications.ow"),
      aow: t("certifications.aow"),
      rescue: t("certifications.rescue"),
      dm: t("certifications.dm"),
      instructor: t("certifications.instructor"),
      nitrox: t("certifications.nitrox"),
      deep: t("certifications.deep"),
      wreck: t("certifications.wreck"),
      night: t("certifications.night"),
      efr: t("certifications.efr"),
    },
    languages: {
      fr: t("languages.fr"),
      en: t("languages.en"),
      es: t("languages.es"),
      it: t("languages.it"),
      de: t("languages.de"),
      pt: t("languages.pt"),
      nl: t("languages.nl"),
      ru: t("languages.ru"),
      zh: t("languages.zh"),
      ja: t("languages.ja"),
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
              {translations.backToCenter}
            </Link>
            <h1 className="text-3xl font-bold text-white">{translations.title}</h1>
            <p className="mt-1 text-white/60">{translations.subtitle}</p>
          </div>
        </div>

        {/* Team List */}
        <TeamListClient
          workers={serializedWorkers}
          locale={locale}
          translations={translations}
        />
      </div>
    </div>
  );
}
