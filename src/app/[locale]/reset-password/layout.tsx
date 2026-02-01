import { generateMetadata as resetPasswordMetadata } from "./metadata";

export { resetPasswordMetadata as generateMetadata };

export default function ResetPasswordLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <>{children}</>;
}