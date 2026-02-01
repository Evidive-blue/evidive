import { generateMetadata as registerMetadata } from "./metadata";

export { registerMetadata as generateMetadata };

export default function RegisterLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <>{children}</>;
}