import { redirect } from "next/navigation";

export default async function SellerOnboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/onboard/seller/account`);
}
