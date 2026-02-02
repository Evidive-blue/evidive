import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import {
  Briefcase,
  MapPin,
  Clock,
  ChevronRight,
  Heart,
  Users,
  Rocket,
  Globe,
  Waves,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const metadataBase = baseUrl ? new URL(baseUrl) : undefined;
  const canonical = baseUrl ? `${baseUrl}/${locale}/careers` : `/${locale}/careers`;

  return {
    metadataBase,
    title: t("careers.title"),
    description: t("careers.description"),
    alternates: {
      canonical,
      languages: baseUrl
        ? {
            fr: `${baseUrl}/fr/careers`,
            en: `${baseUrl}/en/careers`,
            de: `${baseUrl}/de/careers`,
            es: `${baseUrl}/es/careers`,
            it: `${baseUrl}/it/careers`,
          }
        : undefined,
    },
  };
}

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "careers" });

  const values = [
    {
      icon: Heart,
      title: t("values.passion.title"),
      description: t("values.passion.description"),
    },
    {
      icon: Users,
      title: t("values.team.title"),
      description: t("values.team.description"),
    },
    {
      icon: Rocket,
      title: t("values.innovation.title"),
      description: t("values.innovation.description"),
    },
    {
      icon: Globe,
      title: t("values.impact.title"),
      description: t("values.impact.description"),
    },
  ];

  const benefits = [
    { icon: Waves, label: t("benefits.diving") },
    { icon: Globe, label: t("benefits.remote") },
    { icon: Coffee, label: t("benefits.flexibility") },
    { icon: Heart, label: t("benefits.health") },
  ];

  const positions = [
    {
      id: 1,
      title: t("positions.fullstack.title"),
      department: t("positions.fullstack.department"),
      location: t("positions.fullstack.location"),
      type: t("positions.fullstack.type"),
    },
    {
      id: 2,
      title: t("positions.marketing.title"),
      department: t("positions.marketing.department"),
      location: t("positions.marketing.location"),
      type: t("positions.marketing.type"),
    },
    {
      id: 3,
      title: t("positions.support.title"),
      department: t("positions.support.department"),
      location: t("positions.support.location"),
      type: t("positions.support.type"),
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Hero */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400">
            {t("badge")}
          </span>
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/70">
            {t("subtitle")}
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            {t("valuesTitle")}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, _index) => (
              <Card
                key={value.title}
                className="border-white/10 bg-white/5 backdrop-blur-xl"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                    <value.icon className="h-7 w-7 text-cyan-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {value.title}
                  </h3>
                  <p className="text-sm text-white/60">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <Card className="border-white/10 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-600/10 backdrop-blur-xl">
            <CardContent className="p-8">
              <h2 className="mb-6 text-center text-2xl font-bold text-white">
                {t("benefitsTitle")}
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.label}
                    className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-4"
                  >
                    <benefit.icon className="h-6 w-6 text-cyan-400" />
                    <span className="text-sm text-white/80 text-center">
                      {benefit.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            {t("positionsTitle")}
          </h2>
          <div className="space-y-4">
            {positions.map((position) => (
              <Card
                key={position.id}
                className="border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-cyan-500/30 hover:bg-white/10"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {position.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {position.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {position.type}
                        </span>
                      </div>
                    </div>
                    <Link href="/contact">
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500">
                        {t("applyButton")}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="py-12 px-6">
              <h2 className="mb-4 text-2xl font-bold text-white">
                {t("cta.title")}
              </h2>
              <p className="mb-6 text-white/70">
                {t("cta.description")}
              </p>
              <Link href="/contact">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                >
                  {t("cta.button")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
