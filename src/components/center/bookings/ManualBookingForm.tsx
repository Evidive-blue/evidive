"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import {
  createManualBooking,
  getCenterServices,
} from "@/app/[locale]/center/bookings/actions";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  diveDate: z.string().min(1, "Date is required"),
  diveTime: z.string().min(1, "Time is required"),
  participants: z.number().min(1, "At least 1 participant"),
  guestFirstName: z.string().min(1, "First name is required"),
  guestLastName: z.string().min(1, "Last name is required"),
  guestEmail: z.string().email("Invalid email"),
  guestPhone: z.string().optional(),
  specialRequests: z.string().optional(),
  certificationLevel: z.string().optional(),
  extraIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Service {
  id: string;
  name: Record<string, string>;
  price: number;
  currency: string;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  pricePerPerson: boolean;
  startTimes: string[];
  extras: Array<{
    id: string;
    name: Record<string, string>;
    price: number;
    multiplyByPax: boolean;
  }>;
}

interface ManualBookingFormProps {
  locale: string;
  centerId?: string;
  translations: {
    title: string;
    description: string;
    triggerButton: string;
    service: string;
    selectService: string;
    date: string;
    time: string;
    selectTime: string;
    participants: string;
    clientInfo: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    optional: string;
    specialRequests: string;
    certification: string;
    extras: string;
    noExtras: string;
    totalPrice: string;
    submit: string;
    submitting: string;
    cancel: string;
    success: string;
    successMessage: string;
    error: string;
    noServices: string;
    createAnother: string;
    close: string;
  };
}

function getLocalizedText(value: Record<string, string>, locale: string): string {
  return value[locale] || value.fr || value.en || Object.values(value)[0] || "";
}

export function ManualBookingForm({ locale, centerId, translations: t }: ManualBookingFormProps) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    bookingId?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      participants: 1,
      extraIds: [],
    },
  });

  const participants = useWatch({ control, name: "participants" }) ?? 1;
  const serviceId = useWatch({ control, name: "serviceId" });

  // Load services when dialog opens
  useEffect(() => {
    if (open && services.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Loading state needed before async fetch
      setIsLoading(true);
      getCenterServices(centerId).then((res) => {
        if (res.success && res.services) {
          setServices(res.services);
        }
        setIsLoading(false);
      });
    }
  }, [open, services.length, centerId]);

  // Update selected service when serviceId changes
  useEffect(() => {
    const service = services.find((s) => s.id === serviceId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Derived state update when serviceId changes
    setSelectedService(service || null);
    setSelectedExtras([]);
    setValue("extraIds", []);
    
    if (service && service.minParticipants > participants) {
      setValue("participants", service.minParticipants);
    }
  }, [serviceId, services, setValue, participants]);

  // Calculate total price
  const calculateTotal = (): number => {
    if (!selectedService) return 0;

    const basePrice = selectedService.pricePerPerson
      ? selectedService.price * participants
      : selectedService.price;

    let extrasTotal = 0;
    for (const extraId of selectedExtras) {
      const extra = selectedService.extras.find((e) => e.id === extraId);
      if (extra) {
        extrasTotal += extra.multiplyByPax
          ? extra.price * participants
          : extra.price;
      }
    }

    return basePrice + extrasTotal;
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      const newExtras = prev.includes(extraId)
        ? prev.filter((id) => id !== extraId)
        : [...prev, extraId];
      setValue("extraIds", newExtras);
      return newExtras;
    });
  };

  const onSubmit = (data: FormData) => {
    setResult(null);

    startTransition(async () => {
      const res = await createManualBooking({
        centerId,
        serviceId: data.serviceId,
        diveDate: new Date(data.diveDate),
        diveTime: data.diveTime,
        participants: data.participants,
        guestFirstName: data.guestFirstName,
        guestLastName: data.guestLastName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        specialRequests: data.specialRequests,
        certificationLevel: data.certificationLevel,
        extraIds: selectedExtras,
      });

      if (res.success) {
        setResult({
          type: "success",
          message: t.successMessage,
          bookingId: res.bookingId,
        });
      } else {
        setResult({
          type: "error",
          message: res.error || t.error,
        });
      }
    });
  };

  const handleCreateAnother = () => {
    reset();
    setSelectedService(null);
    setSelectedExtras([]);
    setResult(null);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
    setSelectedService(null);
    setSelectedExtras([]);
    setResult(null);
  };

  const total = calculateTotal();
  const formattedTotal = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: selectedService?.currency || "EUR",
  }).format(total);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          {t.triggerButton}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-gray-900/95 backdrop-blur-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{t.title}</DialogTitle>
          <DialogDescription className="text-white/60">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        {result?.type === "success" ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
            <h3 className="mt-4 text-xl font-semibold text-white">{t.success}</h3>
            <p className="mt-2 text-white/60">{result.message}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleCreateAnother}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {t.createAnother}
              </Button>
              <Button onClick={handleClose} className="bg-cyan-500 hover:bg-cyan-600">
                {t.close}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : services.length === 0 ? (
              <div className="py-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-amber-400" />
                <p className="mt-4 text-white/60">{t.noServices}</p>
              </div>
            ) : (
              <>
                {/* Service Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    {t.service} *
                  </label>
                  <select
                    {...register("serviceId")}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="" className="bg-gray-900">
                      {t.selectService}
                    </option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id} className="bg-gray-900">
                        {getLocalizedText(service.name, locale)} -{" "}
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: service.currency,
                        }).format(service.price)}
                        {service.pricePerPerson ? "/pers" : ""}
                      </option>
                    ))}
                  </select>
                  {errors.serviceId && (
                    <p className="text-sm text-red-400">{errors.serviceId.message}</p>
                  )}
                </div>

                {/* Date, Time, Participants */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-white">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                      {t.date} *
                    </label>
                    <Input
                      type="date"
                      {...register("diveDate")}
                      className="bg-white/5 border-white/10 text-white"
                      min={new Date().toISOString().split("T")[0]}
                    />
                    {errors.diveDate && (
                      <p className="text-sm text-red-400">{errors.diveDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-white">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      {t.time} *
                    </label>
                    {selectedService?.startTimes && selectedService.startTimes.length > 0 ? (
                      <select
                        {...register("diveTime")}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="" className="bg-gray-900">
                          {t.selectTime}
                        </option>
                        {selectedService.startTimes.map((time) => (
                          <option key={time} value={time} className="bg-gray-900">
                            {time}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type="time"
                        {...register("diveTime")}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    )}
                    {errors.diveTime && (
                      <p className="text-sm text-red-400">{errors.diveTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-white">
                      <Users className="h-4 w-4 text-cyan-400" />
                      {t.participants} *
                    </label>
                    <Input
                      type="number"
                      {...register("participants", { valueAsNumber: true })}
                      className="bg-white/5 border-white/10 text-white"
                      min={selectedService?.minParticipants || 1}
                      max={selectedService?.maxParticipants || 20}
                    />
                    {selectedService && (
                      <p className="text-xs text-white/40">
                        Min: {selectedService.minParticipants}, Max: {selectedService.maxParticipants}
                      </p>
                    )}
                    {errors.participants && (
                      <p className="text-sm text-red-400">{errors.participants.message}</p>
                    )}
                  </div>
                </div>

                {/* Client Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white">{t.clientInfo}</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">{t.firstName} *</label>
                      <Input
                        {...register("guestFirstName")}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      {errors.guestFirstName && (
                        <p className="text-sm text-red-400">{errors.guestFirstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">{t.lastName} *</label>
                      <Input
                        {...register("guestLastName")}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      {errors.guestLastName && (
                        <p className="text-sm text-red-400">{errors.guestLastName.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">{t.email} *</label>
                      <Input
                        type="email"
                        {...register("guestEmail")}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      {errors.guestEmail && (
                        <p className="text-sm text-red-400">{errors.guestEmail.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">
                        {t.phone} <span className="text-white/40">({t.optional})</span>
                      </label>
                      <Input
                        type="tel"
                        {...register("guestPhone")}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Certification & Special Requests */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-white/60">
                      {t.certification} <span className="text-white/40">({t.optional})</span>
                    </label>
                    <select
                      {...register("certificationLevel")}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="" className="bg-gray-900">-</option>
                      <option value="Open Water" className="bg-gray-900">Open Water</option>
                      <option value="Advanced Open Water" className="bg-gray-900">Advanced Open Water</option>
                      <option value="Rescue Diver" className="bg-gray-900">Rescue Diver</option>
                      <option value="Divemaster" className="bg-gray-900">Divemaster</option>
                      <option value="Instructor" className="bg-gray-900">Instructor</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/60">
                      {t.specialRequests} <span className="text-white/40">({t.optional})</span>
                    </label>
                    <Input
                      {...register("specialRequests")}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Extras */}
                {selectedService && selectedService.extras.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-white">{t.extras}</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {selectedService.extras.map((extra) => {
                        const isSelected = selectedExtras.includes(extra.id);
                        const extraPrice = extra.multiplyByPax
                          ? extra.price * participants
                          : extra.price;

                        return (
                          <button
                            key={extra.id}
                            type="button"
                            onClick={() => toggleExtra(extra.id)}
                            className={cn(
                              "flex items-center justify-between rounded-lg border p-3 text-left transition-all",
                              isSelected
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            )}
                          >
                            <span className="text-sm text-white">
                              {getLocalizedText(extra.name, locale)}
                              {extra.multiplyByPax && (
                                <span className="text-white/40"> (x{participants})</span>
                              )}
                            </span>
                            <span className="text-sm font-medium text-cyan-400">
                              +{new Intl.NumberFormat(locale, {
                                style: "currency",
                                currency: selectedService.currency,
                              }).format(extraPrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {result?.type === "error" && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-red-300">
                    <AlertCircle className="h-5 w-5" />
                    {result.message}
                  </div>
                )}

                {/* Total & Submit */}
                <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-white/60">{t.totalPrice}</p>
                    <p className="text-2xl font-bold text-emerald-400">{formattedTotal}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {t.cancel}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending || !selectedService}
                      className="bg-cyan-500 hover:bg-cyan-600"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.submitting}
                        </>
                      ) : (
                        t.submit
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
