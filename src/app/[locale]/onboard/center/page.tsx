import { redirect } from "next/navigation";

export default async function CenterOnboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/onboard/center/account`);
}
