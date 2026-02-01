import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AboutHero } from "@/components/about/about-hero";
import { AboutStory } from "@/components/about/about-story";
import { AboutMission } from "@/components/about/about-mission";
import { AboutValues } from "@/components/about/about-values";
import { AboutTeam } from "@/components/about/about-team";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
    },
  };
}

export default async function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutStory />
      <AboutMission />
      <AboutValues />
      <AboutTeam />
    </>
  );
}
