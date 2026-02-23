import { AdminPage } from "@/components/admin/admin-page";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return (
    <AdminPage
      titleKey="bookingDetail"
      columns={["id", "client", "service", "status", "date"]}
    />
  );
}
