import { generateMetadata as contactMetadata } from "./metadata";

export { contactMetadata as generateMetadata };

export default function ContactLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <>{children}</>;
}