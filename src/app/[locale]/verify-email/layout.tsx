import { generateMetadata as verifyEmailMetadata } from "./metadata";

export { verifyEmailMetadata as generateMetadata };

export default function VerifyEmailLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <>{children}</>;
}