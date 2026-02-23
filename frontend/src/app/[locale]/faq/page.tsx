import { getTranslations } from "next-intl/server";
import { FaqClient } from "./faq-client";

export async function generateMetadata() {
  const t = await getTranslations("faq");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default function FaqPage() {
  return <FaqClient />;
}
