import { redirect } from "next/navigation";

/**
 * Redirect from /centers/[slug] to /center/[slug] for URL consistency
 */
export default async function CenterRedirectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  redirect(`/${locale}/center/${slug}`);
}
