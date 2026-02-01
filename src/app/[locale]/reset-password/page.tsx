import { setRequestLocale } from "next-intl/server";
import { verifyResetToken } from "./actions";
import { ResetPasswordForm } from "./reset-password-form";
import { TokenExpiredView } from "./token-expired-view";
import { TokenInvalidView } from "./token-invalid-view";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { token } = await searchParams;

  // If no token provided, show invalid token view
  if (!token) {
    return <TokenInvalidView />;
  }

  // Verify the token
  const tokenResult = await verifyResetToken(token);

  // Handle different token states
  if (!tokenResult.valid) {
    if (tokenResult.error === "expired" || tokenResult.error === "used") {
      return <TokenExpiredView />;
    }
    return <TokenInvalidView />;
  }

  // Token is valid, show reset form
  return <ResetPasswordForm token={token} email={tokenResult.email!} />;
}
