import { getTranslations } from "next-intl/server";
import { CentersClient } from "./centers-client";

export async function generateMetadata() {
  const t = await getTranslations("centersPage");
  return {
    title: t("heroTitle"),
    description: t("heroSubtitle"),
  };
}

export default function CentersPage() {
  return <CentersClient />;
}
