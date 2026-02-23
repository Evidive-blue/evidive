import { getTranslations } from "next-intl/server";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarWrapper } from "@/components/admin/sidebar-wrapper";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("admin");

  return (
    <AdminGuard>
      <SidebarWrapper sidebar={<AdminSidebar />} title={t("title")}>
        {children}
      </SidebarWrapper>
      <Toaster richColors position="bottom-right" />
    </AdminGuard>
  );
}
