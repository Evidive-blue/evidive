import { getTranslations } from "next-intl/server";
import { CareersClient } from "./careers-client";

export async function generateMetadata() {
  const t = await getTranslations("careers");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default function CareersPage() {
  return <CareersClient />;
}
