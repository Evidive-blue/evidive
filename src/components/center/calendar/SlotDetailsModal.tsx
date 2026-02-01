"use client";

import * as React from "react";
import {
  Popup,
  PopupContent,
  PopupHeader,
  PopupTitle,
  PopupDescription,
  PopupFooter,
} from "@/components/ui/popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { closeSlotAction, addManualBookingAction } from "@/app/[locale]/center/calendar/actions";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Users,
  Mail,
  User,
  Ban,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface BookingData {
  id: string;
  reference: string;
  diveDate: string;
  diveTime: string;
  participants: number;
  status: string;
  guestEmail: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  service: {
    id: string;
    name: unknown;
    maxParticipants: number;
    durationMinutes: number;
  };
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
  } | null;
}

interface ServiceData {
  id: string;
  name: unknown;
  maxParticipants: number;
  startTimes: string[];
}

interface SlotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  time: string | null;
  bookings: BookingData[];
  service: ServiceData | null;
  centerId: string;
  services: ServiceData[];
  locale: string;
  translations: {
    slotDetails: string;
    service: string;
    dateTime: string;
    participants: string;
    placesRemaining: string;
    registeredParticipants: string;
    noParticipants: string;
    addManualBooking: string;
    closeSlot: string;
    cancel: string;
    confirm: string;
    status: Record<string, string>;
    manualBookingForm?: {
      title: string;
      serviceLabel: string;
      selectService: string;
      dateLabel: string;
      timeLabel: string;
      participantsLabel: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      optional: string;
      submit: string;
      submitting: string;
      success: string;
      error: string;
      back: string;
    };
  };
}

function getLocalizedText(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as Record<string, unknown>;
  const direct = obj[locale];
  if (typeof direct === "string" && direct.trim().length > 0) return direct;
  const fallback = obj.fr;
  if (typeof fallback === "string" && fallback.trim().length > 0) return fallback;
  return "";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "CONFIRMED":
    case "PAID":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "PENDING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "RUNNING":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
    case "COMPLETED":
      return "border-purple-500/20 bg-purple-500/10 text-purple-300";
    case "CANCELLED":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

export function SlotDetailsModal({
  isOpen,
  onClose,
  date,
  time,
  bookings,
  service,
  centerId,
  services,
  locale,
  translations: t,
}: SlotDetailsModalProps) {
  const [isClosing, setIsClosing] = React.useState(false);
  const [showManualForm, setShowManualForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitResult, setSubmitResult] = React.useState<{ success: boolean; message?: string } | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    serviceId: service?.id || (bookings.length > 0 ? bookings[0].service.id : ""),
    diveTime: time || "",
    participants: 1,
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestPhone: "",
  });

  const totalParticipants = bookings.reduce((sum, b) => sum + b.participants, 0);
  const maxParticipants = service?.maxParticipants || 
    (bookings.length > 0 ? bookings[0].service.maxParticipants : 10);
  const placesRemaining = maxParticipants - totalParticipants;

  const formattedDate = date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const serviceName = service
    ? getLocalizedText(service.name, locale)
    : bookings.length > 0
    ? getLocalizedText(bookings[0].service.name, locale)
    : "";

  const handleCloseSlot = async () => {
    if (!time) return;
    
    setIsClosing(true);
    const fd = new FormData();
    fd.set("centerId", centerId);
    fd.set("blockedDate", date.toISOString());
    fd.set("blockedTime", time);
    fd.set("reason", `Slot closed by center on ${new Date().toISOString()}`);

    const result = await closeSlotAction(fd);
    setIsClosing(false);

    if (result.success) {
      onClose();
    }
  };

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    const fd = new FormData();
    fd.set("centerId", centerId);
    fd.set("serviceId", formData.serviceId);
    fd.set("diveDate", date.toISOString());
    fd.set("diveTime", formData.diveTime);
    fd.set("participants", String(formData.participants));
    fd.set("guestFirstName", formData.guestFirstName);
    fd.set("guestLastName", formData.guestLastName);
    fd.set("guestEmail", formData.guestEmail);
    if (formData.guestPhone) {
      fd.set("guestPhone", formData.guestPhone);
    }

    const result = await addManualBookingAction(fd);
    setIsSubmitting(false);

    if (result.success) {
      setSubmitResult({ success: true });
      // Reset form and close after delay
      setTimeout(() => {
        setShowManualForm(false);
        setSubmitResult(null);
        setFormData({
          serviceId: service?.id || "",
          diveTime: time || "",
          participants: 1,
          guestFirstName: "",
          guestLastName: "",
          guestEmail: "",
          guestPhone: "",
        });
        onClose();
      }, 1500);
    } else {
      setSubmitResult({ success: false, message: result.error });
    }
  };

  const ft = t.manualBookingForm || {
    title: "Add manual booking",
    serviceLabel: "Service",
    selectService: "Select a service",
    dateLabel: "Date",
    timeLabel: "Time",
    participantsLabel: "Participants",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    optional: "optional",
    submit: "Create booking",
    submitting: "Creating...",
    success: "Booking created!",
    error: "An error occurred",
    back: "Back",
  };

  return (
    <Popup open={isOpen} onOpenChange={onClose}>
      <PopupContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {showManualForm ? (
          // Manual booking form
          <>
            <PopupHeader>
              <PopupTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-cyan-400" />
                {ft.title}
              </PopupTitle>
              <PopupDescription>
                {formattedDate}
                {time && ` · ${time}`}
              </PopupDescription>
            </PopupHeader>

            {submitResult?.success ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <CheckCircle className="h-12 w-12 text-emerald-400" />
                <p className="text-lg font-medium text-white">{ft.success}</p>
              </div>
            ) : (
              <form onSubmit={handleManualBookingSubmit} className="space-y-4 py-4">
                {/* Service selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">{ft.serviceLabel}</label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    required
                  >
                    <option value="" className="bg-slate-900">{ft.selectService}</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900">
                        {getLocalizedText(s.name, locale)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{ft.timeLabel}</label>
                    <Input
                      type="time"
                      value={formData.diveTime}
                      onChange={(e) => setFormData({ ...formData, diveTime: e.target.value })}
                      className="border-white/10 bg-white/5 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{ft.participantsLabel}</label>
                    <Input
                      type="number"
                      min={1}
                      max={placesRemaining}
                      value={formData.participants}
                      onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value, 10) || 1 })}
                      className="border-white/10 bg-white/5 text-white"
                      required
                    />
                  </div>
                </div>

                {/* Guest info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{ft.firstName}</label>
                    <Input
                      value={formData.guestFirstName}
                      onChange={(e) => setFormData({ ...formData, guestFirstName: e.target.value })}
                      className="border-white/10 bg-white/5 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{ft.lastName}</label>
                    <Input
                      value={formData.guestLastName}
                      onChange={(e) => setFormData({ ...formData, guestLastName: e.target.value })}
                      className="border-white/10 bg-white/5 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{ft.email}</label>
                    <Input
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                      className="border-white/10 bg-white/5 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      {ft.phone} <span className="text-white/40">({ft.optional})</span>
                    </label>
                    <Input
                      type="tel"
                      value={formData.guestPhone}
                      onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>

                {/* Error message */}
                {submitResult?.success === false && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    {submitResult.message || ft.error}
                  </div>
                )}

                <PopupFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualForm(false)}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {ft.back}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {ft.submitting}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {ft.submit}
                      </>
                    )}
                  </Button>
                </PopupFooter>
              </form>
            )}
          </>
        ) : (
          // Slot details view
          <>
            <PopupHeader>
              <PopupTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-400" />
                {t.slotDetails}
              </PopupTitle>
              <PopupDescription>
                {formattedDate}
                {time && ` · ${time}`}
              </PopupDescription>
            </PopupHeader>

            <div className="space-y-4 py-4">
              {/* Service info */}
              {serviceName && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/50">{t.service}</div>
                  <div className="mt-1 font-medium text-white">{serviceName}</div>
                </div>
              )}

              {/* Capacity info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Users className="h-3 w-3" />
                    {t.participants}
                  </div>
                  <div className="mt-1 text-xl font-semibold text-white">
                    {totalParticipants}/{maxParticipants}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <CheckCircle className="h-3 w-3" />
                    {t.placesRemaining}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-xl font-semibold",
                      placesRemaining > 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {placesRemaining}
                  </div>
                </div>
              </div>

              {/* Participants list */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-3 text-sm font-medium text-white">{t.registeredParticipants}</div>

                {bookings.length === 0 ? (
                  <div className="py-4 text-center text-sm text-white/50">{t.noParticipants}</div>
                ) : (
                  <div className="space-y-2">
                    {bookings.map((booking) => {
                      const name = booking.user
                        ? booking.user.displayName ||
                          `${booking.user.firstName || ""} ${booking.user.lastName || ""}`.trim() ||
                          booking.user.email
                        : `${booking.guestFirstName || ""} ${booking.guestLastName || ""}`.trim() ||
                          booking.guestEmail;

                      const email = booking.user?.email || booking.guestEmail;

                      return (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                              <User className="h-4 w-4 text-white/60" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{name}</div>
                              <div className="flex items-center gap-2 text-xs text-white/50">
                                <Mail className="h-3 w-3" />
                                {email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/70">
                              ×{booking.participants}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-xs",
                                getStatusColor(booking.status)
                              )}
                            >
                              {t.status[booking.status] || booking.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <PopupFooter>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="order-2 sm:order-1"
                >
                  {t.cancel}
                </Button>
                <div className="order-1 flex gap-2 sm:order-2">
                  {time && placesRemaining > 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => setShowManualForm(true)}
                      className="flex-1 sm:flex-none"
                    >
                      <Plus className="h-4 w-4" />
                      {t.addManualBooking}
                    </Button>
                  )}
                  {time && (
                    <Button
                      variant="destructive"
                      onClick={handleCloseSlot}
                      disabled={isClosing}
                      className="flex-1 sm:flex-none"
                    >
                      {isClosing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                      {t.closeSlot}
                    </Button>
                  )}
                </div>
              </div>
            </PopupFooter>
          </>
        )}
      </PopupContent>
    </Popup>
  );
}
