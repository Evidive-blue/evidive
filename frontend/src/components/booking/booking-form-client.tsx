"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  publicApi,
  bookingApi,
  couponApi,
  isAuthenticated,
  type PublicCenter,
  type PublicService,
  type AvailabilitySlot,
  type CreateBookingRequest,
  type CouponValidationResponse,
} from "@/lib/api";
import {
  CalendarDays,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Tag,
  Check,
  X,
  Loader2,
} from "lucide-react";

const bookingSchema = z.object({
  date: z.string().min(1),
  time_slot: z.string().min(1),
  participants_count: z.number().min(1).max(50),
  guest_info: z.string().optional(),
  notes: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

type Step = 1 | 2 | 3;

export function BookingFormClient({
  centerId,
  serviceId,
}: {
  centerId: string;
  serviceId: string;
}) {
  const t = useTranslations("booking");
  const format = useFormatter();
  const router = useRouter();
  const [center, setCenter] = useState<PublicCenter | null>(null);
  const [service, setService] = useState<PublicService | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] =
    useState<CouponValidationResponse | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      participants_count: 1,
    },
  });

  const selectedDate = watch("date");
  const selectedSlot = watch("time_slot");
  const participantsCount = watch("participants_count");

  // Load center & service
  useEffect(() => {
    Promise.all([
      publicApi.getCenterById(centerId),
      publicApi.getServices(centerId),
    ])
      .then(([c, services]) => {
        setCenter(c);
        const svc = services.find((s) => s.id === serviceId);
        setService(svc ?? null);
      })
      .catch(() => toast.error(t("errorMessage")))
      .finally(() => setLoading(false));
  }, [centerId, serviceId, t]);

  // Load availability when date changes
  const loadSlots = useCallback(async () => {
    if (!selectedDate || !serviceId) {
      return;
    }
    try {
      const data = await bookingApi.checkAvailability({
        service_id: serviceId,
        date: selectedDate,
      });
      setSlots(data);
    } catch {
      setSlots([]);
    }
  }, [selectedDate, serviceId]);

  useEffect(() => {
    if (selectedDate) {
      loadSlots();
    }
  }, [selectedDate, loadSlots]);

  const handleValidateCoupon = useCallback(async () => {
    const trimmed = couponCode.trim();
    if (!trimmed) {
      return;
    }

    setValidatingCoupon(true);
    try {
      const result = await couponApi.validate(trimmed, centerId, serviceId);
      setCouponValidation(result);
    } catch {
      setCouponValidation({
        valid: false,
        coupon_id: null,
        discount_type: null,
        discount_value: null,
        message: "validation_error",
      });
    } finally {
      setValidatingCoupon(false);
    }
  }, [couponCode, centerId, serviceId]);

  const clearCoupon = useCallback(() => {
    setCouponCode("");
    setCouponValidation(null);
  }, []);

  const onSubmit = async (data: BookingForm) => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const slot = slots.find(
        (s) => `${s.start_time}|${s.end_time}` === data.time_slot
      );
      if (!slot) {
        throw new Error("Invalid slot");
      }

      const body: CreateBookingRequest = {
        service_id: serviceId,
        center_id: centerId,
        booking_date: data.date,
        time_slot: data.time_slot,
        start_time: slot.start_time,
        end_time: slot.end_time,
        participants: data.participants_count,
        client_note: data.notes || undefined,
      };

      await bookingApi.create(body);
      router.push("/book/success");
    } catch {
      toast.error(t("errorMessage"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 pb-24">
        <div className="mx-auto flex max-w-2xl items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      </section>
    );
  }

  if (!center || !service) {
    return (
      <section className="container mx-auto px-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <p className="text-red-400 dark:text-red-300">{t("errorMessage")}</p>
        </div>
      </section>
    );
  }

  const basePrice = (parseFloat(String(service.price)) || 0) * participantsCount;
  const discountAmount =
    couponValidation?.valid && couponValidation.discount_value
      ? couponValidation.discount_type === "percent"
        ? Math.round((basePrice * couponValidation.discount_value) / 100)
        : couponValidation.discount_value
      : 0;
  const totalPrice = Math.max(0, basePrice - discountAmount);

  return (
    <section className="container mx-auto px-4 pb-24">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white dark:text-slate-100">
            {t("title")}
          </h1>
          <p className="text-slate-400 dark:text-slate-400">
            {center.name} &middot; {service.name}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {(parseFloat(String(service.price)) || 0).toFixed(2)} € {t("perPerson")} &middot;{" "}
            {service.duration_minutes} {t("minutes")}
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-3">
          {([1, 2, 3] as const).map((s) => (
            <div
              key={s}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? "bg-cyan-600 text-white dark:bg-cyan-600 dark:text-white"
                  : step > s
                    ? "bg-cyan-600/30 text-cyan-400 dark:bg-cyan-600/30 dark:text-cyan-400"
                    : "bg-slate-800 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {s}
            </div>
          ))}
          <span className="text-sm text-slate-400 dark:text-slate-500">
            {t("step", { current: step, total: 3 })}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1: Date & Time */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300 dark:text-slate-400">
                    <CalendarDays className="h-4 w-4" />
                    {t("selectDate")}
                  </label>
                  <input
                    {...register("date")}
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500"
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-400 dark:text-red-300">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                {selectedDate && (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300 dark:text-slate-400">
                      <Clock className="h-4 w-4" />
                      {t("selectTime")}
                    </label>
                    {slots.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        {t("noSlots")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slots
                          .filter((s) => s.available)
                          .map((slot) => {
                            const key = `${slot.start_time}|${slot.end_time}`;
                            const startTime = format.dateTime(
                              new Date(slot.start_time),
                              { timeStyle: "short" }
                            );
                            const isSelected = selectedSlot === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setValue("time_slot", key)}
                                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                                  isSelected
                                    ? "border-cyan-500 bg-cyan-600/20 text-cyan-300 dark:border-cyan-500 dark:bg-cyan-600/20 dark:text-cyan-300"
                                    : "border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-500/50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cyan-500/50"
                                }`}
                              >
                                {startTime}
                              </button>
                            );
                          })}
                      </div>
                    )}
                    {errors.time_slot && (
                      <p className="mt-1 text-xs text-red-400 dark:text-red-300">
                        {errors.time_slot.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!selectedDate || !selectedSlot}
                    className="flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Participants */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300 dark:text-slate-400">
                    <Users className="h-4 w-4" />
                    {t("participants")}
                  </label>
                  <input
                    {...register("participants_count", { valueAsNumber: true })}
                    type="number"
                    min={1}
                    max={service.capacity ?? 50}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500"
                  />
                  {errors.participants_count && (
                    <p className="mt-1 text-xs text-red-400 dark:text-red-300">
                      {errors.participants_count.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300 dark:text-slate-400">
                    {t("guestNames")}
                  </label>
                  <input
                    {...register("guest_info")}
                    placeholder={t("guestNamesPlaceholder")}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300 dark:text-slate-400">
                    {t("notes")}
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                  >
                    {t("review")}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review & Confirm */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 dark:border-slate-600 dark:bg-slate-800/50">
                  <h2 className="mb-4 text-lg font-semibold dark:text-slate-100">
                    {t("review")}
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">
                        {t("selectService")}
                      </span>
                      <span className="text-white dark:text-slate-100">
                        {service.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">
                        {t("selectDate")}
                      </span>
                      <span className="text-white dark:text-slate-100">
                        {selectedDate}
                      </span>
                    </div>
                    {selectedSlot && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500">
                          {t("selectTime")}
                        </span>
                        <span className="text-white dark:text-slate-100">
                          {format.dateTime(
                            new Date(selectedSlot.split("|")[0] ?? ""),
                            { timeStyle: "short" }
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">
                        {t("participants")}
                      </span>
                      <span className="text-white dark:text-slate-100">
                        {participantsCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">
                        {t("duration")}
                      </span>
                      <span className="text-white dark:text-slate-100">
                        {service.duration_minutes} {t("minutes")}
                      </span>
                    </div>
                    {/* Coupon code */}
                    <div className="border-t border-slate-700 pt-3 dark:border-slate-600">
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300 dark:text-slate-400">
                        <Tag className="h-4 w-4" />
                        {t("promoCode")}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            if (couponValidation) {
                              setCouponValidation(null);
                            }
                          }}
                          placeholder={t("promoCodePlaceholder")}
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                        {couponValidation?.valid ? (
                          <button
                            type="button"
                            onClick={clearCoupon}
                            className="flex items-center gap-1 rounded-lg border border-red-500/50 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleValidateCoupon}
                            disabled={!couponCode.trim() || validatingCoupon}
                            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                          >
                            {validatingCoupon ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              t("apply")
                            )}
                          </button>
                        )}
                      </div>
                      {couponValidation && (
                        <p
                          className={`mt-1.5 flex items-center gap-1 text-xs ${
                            couponValidation.valid
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {couponValidation.valid ? (
                            <>
                              <Check className="h-3 w-3" />
                              {t("couponApplied", {
                                value: couponValidation.discount_value ?? 0,
                                type:
                                  couponValidation.discount_type === "percent"
                                    ? "%"
                                    : "€",
                              })}
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3" />
                              {t(`couponError.${couponValidation.message}`)}
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="border-t border-slate-700 pt-3 dark:border-slate-600">
                      {discountAmount > 0 && (
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-500">
                            {t("subtotal")}
                          </span>
                          <span className="text-slate-400 line-through dark:text-slate-500">
                            {basePrice.toFixed(2)} €
                          </span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-emerald-400 dark:text-emerald-400">
                            {t("discount")}
                          </span>
                          <span className="text-emerald-400 dark:text-emerald-400">
                            -{discountAmount.toFixed(2)} €
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-semibold">
                        <span className="text-slate-300 dark:text-slate-300">
                          {t("total")}
                        </span>
                        <span className="text-cyan-400 dark:text-cyan-400">
                          {totalPrice.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-cyan-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                  >
                    {submitting ? t("processing") : t("confirm")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </section>
  );
}
