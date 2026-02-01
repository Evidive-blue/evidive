import { generateMetadata as loginMetadata } from "./metadata";

export { loginMetadata as generateMetadata };

export default function LoginLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <>{children}</>;
}