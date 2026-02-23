import { getTranslations } from "next-intl/server";
import { AboutClient } from "./about-client";

export async function generateMetadata() {
  const t = await getTranslations("about");
  return {
    title: t("heroTitle"),
    description: t("heroSubtitle"),
  };
}

export default function AboutPage() {
  return <AboutClient />;
}
