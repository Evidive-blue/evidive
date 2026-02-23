import { getTranslations } from "next-intl/server";
import { PartnerClient } from "./partner-client";

export async function generateMetadata() {
  const t = await getTranslations("partner");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default function PartnerPage() {
  return <PartnerClient />;
}
