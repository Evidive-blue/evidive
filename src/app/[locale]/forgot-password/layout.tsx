import { generateMetadata as forgotPasswordMetadata } from "./metadata";
import { setRequestLocale } from "next-intl/server";

export { forgotPasswordMetadata as generateMetadata };

export default async function ForgotPasswordLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <>{children}</>;
}
