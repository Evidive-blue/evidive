import { redirect } from "next/navigation";

export default async function DiverOnboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/onboard/diver/account`);
}
