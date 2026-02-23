import { AdminCenterDetailClient } from "@/components/admin/admin-center-detail-client";

export default async function AdminCenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminCenterDetailClient centerId={id} />;
}
