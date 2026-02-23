import { getTranslations } from "next-intl/server";
import { publicApi } from "@/lib/api";
import { CenterDetailClient } from "./center-detail-client";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slugOrId: string }>;
}) {
  const { slugOrId } = await params;
  const t = await getTranslations("centersPage");

  try {
    const center = UUID_REGEX.test(slugOrId)
      ? await publicApi.getCenterById(slugOrId)
      : await publicApi.getCenterBySlug(slugOrId);

    const title = center.city
      ? `${center.name} — ${center.city}`
      : center.name;

    return {
      title,
      description: center.description ?? t("heroSubtitle"),
      openGraph: {
        title,
        description: center.description ?? t("heroSubtitle"),
        ...(center.cover_url ? { images: [{ url: center.cover_url }] } : {}),
      },
    };
  } catch {
    return { title: t("heroTitle") };
  }
}

export default async function CenterDetailPage({
  params,
}: {
  params: Promise<{ slugOrId: string }>;
}) {
  const { slugOrId } = await params;
  const t = await getTranslations("centersPage");
  return (
    <CenterDetailClient
      slugOrId={slugOrId}
      isUuid={UUID_REGEX.test(slugOrId)}
      notFoundLabel={t("empty")}
    />
  );
}
