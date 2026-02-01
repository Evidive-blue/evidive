import { generateMetadata as explorerMetadata } from "./metadata";

export { explorerMetadata as generateMetadata };

export default function ExplorerLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <>{children}</>;
}