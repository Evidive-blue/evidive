import { AdminPage } from "@/components/admin/admin-page";

export default async function AdminServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return (
    <AdminPage
      titleKey="serviceDetail"
      columns={["id", "name", "center", "price", "date"]}
    />
  );
}
