import { BookingFormClient } from "@/components/booking/booking-form-client";

type PageProps = {
  params: Promise<{ centerId: string; serviceId: string }>;
};

export default async function BookingPage({ params }: PageProps) {
  const { centerId, serviceId } = await params;
  return <BookingFormClient centerId={centerId} serviceId={serviceId} />;
}
