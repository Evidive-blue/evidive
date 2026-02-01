import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getCenterProfile } from "./actions";
import { CenterProfileForm } from "@/components/center/CenterProfileForm";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerProfile" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerProfile" });

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Check if user is CENTER_OWNER or ADMIN
  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Get center profile data
  const result = await getCenterProfile();

  // If no center found, redirect to center creation
  if (!result.success || !result.data) {
    redirect(`/${locale}/onboard/center`);
  }

  // If center is not approved, show pending status
  if (result.data.status !== "APPROVED") {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-8 backdrop-blur-xl">
            <h1 className="text-2xl font-bold text-amber-200">
              {t("pendingApproval.title")}
            </h1>
            <p className="mt-4 text-amber-200/80">
              {t("pendingApproval.description")}
            </p>
            <div className="mt-6 flex gap-4">
              <Link
                href="/center"
                className="inline-block rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                {t("pendingApproval.backToDashboard")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const translations = {
    title: t("title"),
    subtitle: t("subtitle"),
    previewLink: t("previewLink"),
    saveSuccess: t("saveSuccess"),
    saveError: t("saveError"),
    saving: t("saving"),
    save: t("save"),
    sections: {
      identity: {
        title: t("sections.identity.title"),
        description: t("sections.identity.description"),
      },
      description: {
        title: t("sections.description.title"),
        description: t("sections.description.description"),
      },
      contact: {
        title: t("sections.contact.title"),
        description: t("sections.contact.description"),
      },
      practical: {
        title: t("sections.practical.title"),
        description: t("sections.practical.description"),
      },
      engagement: {
        title: t("sections.engagement.title"),
        description: t("sections.engagement.description"),
      },
      payments: {
        title: t("sections.payments.title"),
        description: t("sections.payments.description"),
      },
      location: {
        title: t("sections.location.title"),
        description: t("sections.location.description"),
      },
    },
    fields: {
      name: t("fields.name"),
      logo: t("fields.logo"),
      coverImage: t("fields.coverImage"),
      gallery: t("fields.gallery"),
      shortDescription: t("fields.shortDescription"),
      fullDescription: t("fields.fullDescription"),
      address: t("fields.address"),
      street2: t("fields.street2"),
      city: t("fields.city"),
      region: t("fields.region"),
      country: t("fields.country"),
      zip: t("fields.zip"),
      phone: t("fields.phone"),
      email: t("fields.email"),
      website: t("fields.website"),
      facebook: t("fields.facebook"),
      instagram: t("fields.instagram"),
      whatsapp: t("fields.whatsapp"),
      openingHours: t("fields.openingHours"),
      languages: t("fields.languages"),
      certifications: t("fields.certifications"),
      equipmentRental: t("fields.equipmentRental"),
      ecoCommitment: t("fields.ecoCommitment"),
      paymentTypes: t("fields.paymentTypes"),
      stripeAccount: t("fields.stripeAccount"),
      stripeConnected: t("fields.stripeConnected"),
      stripeNotConnected: t("fields.stripeNotConnected"),
      stripeOnboarding: t("fields.stripeOnboarding"),
      latitude: t("fields.latitude"),
      longitude: t("fields.longitude"),
    },
    days: {
      monday: t("days.monday"),
      tuesday: t("days.tuesday"),
      wednesday: t("days.wednesday"),
      thursday: t("days.thursday"),
      friday: t("days.friday"),
      saturday: t("days.saturday"),
      sunday: t("days.sunday"),
    },
    open: t("open"),
    closed: t("closed"),
    yes: t("yes"),
    no: t("no"),
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/center"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("backToDashboard")}
        </Link>

        {/* Form */}
        <CenterProfileForm
          initialData={result.data}
          translations={translations}
          locale={locale}
        />
      </div>
    </div>
  );
}
