import { getTranslations } from "next-intl/server";
import { DashboardGuard } from "@/components/dashboard/dashboard-guard";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarWrapper } from "@/components/admin/sidebar-wrapper";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("dashboard");

  return (
    <DashboardGuard>
      <SidebarWrapper sidebar={<DashboardSidebar />} title={t("title")}>
        {children}
      </SidebarWrapper>
      <Toaster richColors position="bottom-right" />
    </DashboardGuard>
  );
}
