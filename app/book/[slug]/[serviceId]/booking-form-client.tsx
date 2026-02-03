'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  User,
  CreditCard,
  Check,
  Loader2,
  MapPin,
  Info,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/lib/i18n/locale-provider';
import { toast } from 'sonner';

interface Extra {
  id: string;
  name: unknown;
  description: unknown;
  price: number;
  multiplyByPax: boolean;
  isRequired: boolean;
}

interface Center {
  id: string;
  slug: string;
  name: unknown;
  email: string;
  phone: string;
  city: string;
  country: string;
  cancellationPolicy: string;
  cancellationHours: number;
}

interface Service {
  id: string;
  name: unknown;
  description: unknown;
  price: number;
  currency: string;
  pricePerPerson: boolean;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  minCertification: string | null;
  equipmentIncluded: boolean;
  availableDays: string[];
  startTimes: string[];
  center: Center;
  extras: Extra[];
}

interface BookingFormClientProps {
  service: Service;
}

const bookingSchema = z.object({
  diveDate: z.string().min(1, 'Date is required'),
  diveTime: z.string().min(1, 'Time is required'),
  participants: z.number().min(1),
  guestFirstName: z.string().min(1, 'First name is required'),
  guestLastName: z.string().min(1, 'Last name is required'),
  guestEmail: z.string().email('Invalid email'),
  guestPhone: z.string().optional(),
  specialRequests: z.string().optional(),
  certificationLevel: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookingFormClient({ service }: BookingFormClientProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [couponCode, setCouponCode] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      participants: service.minParticipants,
      acceptTerms: false,
    },
  });

  const participants = watch('participants');

  const getLocalized = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const obj = value as Record<string, string>;
      return obj[locale] || obj.en || obj.fr || Object.values(obj)[0] || '';
    }
    return '';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: service.currency,
    }).format(price);
  };

  // Calculate totals
  const basePrice = service.pricePerPerson ? service.price * participants : service.price;
  
  const extrasTotal = Object.entries(selectedExtras).reduce((total, [extraId, qty]) => {
    const extra = service.extras.find((e) => e.id === extraId);
    if (!extra || qty === 0) return total;
    const extraPrice = extra.multiplyByPax ? extra.price * qty * participants : extra.price * qty;
    return total + extraPrice;
  }, 0);

  const totalPrice = basePrice + extrasTotal;

  // Get available dates (next 60 days, excluding unavailable days)
  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (let i = 1; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];

      if (service.availableDays.includes(dayName)) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }

    return dates;
  };

  const availableDates = getAvailableDates();

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      const current = prev[extraId] || 0;
      if (current === 0) {
        return { ...prev, [extraId]: 1 };
      }
      const { [extraId]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateExtraQuantity = (extraId: string, delta: number) => {
    setSelectedExtras((prev) => {
      const current = prev[extraId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [extraId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [extraId]: newQty };
    });
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);

    try {
      // Create booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerId: service.center.id,
          serviceId: service.id,
          diveDate: data.diveDate,
          diveTime: data.diveTime,
          participants: data.participants,
          guestFirstName: data.guestFirstName,
          guestLastName: data.guestLastName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          specialRequests: data.specialRequests,
          certificationLevel: data.certificationLevel,
          extras: Object.entries(selectedExtras)
            .filter(([, qty]) => qty > 0)
            .map(([extraId, quantity]) => ({ extraId, quantity })),
          couponCode: couponCode || undefined,
        }),
      });

      if (!bookingResponse.ok) {
        const error = await bookingResponse.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      const { booking } = await bookingResponse.json();

      // Create Stripe checkout session
      const checkoutResponse = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await checkoutResponse.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href={`/centers/${service.center.slug}`}
          className="mb-6 inline-flex items-center text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {getLocalized(service.center.name)}
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">
                    Book: {getLocalized(service.name)}
                  </CardTitle>
                  <p className="text-white/60">
                    <MapPin className="mr-1 inline h-4 w-4" />
                    {service.center.city}, {service.center.country}
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Date & Time */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-white">
                          <Calendar className="mr-2 inline h-4 w-4" />
                          Date
                        </Label>
                        <select
                          {...register('diveDate')}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                        >
                          <option value="">Select date</option>
                          {availableDates.map((date) => (
                            <option key={date} value={date}>
                              {new Date(date).toLocaleDateString(locale, {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </option>
                          ))}
                        </select>
                        {errors.diveDate && (
                          <p className="mt-1 text-sm text-red-400">{errors.diveDate.message}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-white">
                          <Clock className="mr-2 inline h-4 w-4" />
                          Time
                        </Label>
                        <select
                          {...register('diveTime')}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                        >
                          <option value="">Select time</option>
                          {service.startTimes.length > 0
                            ? service.startTimes.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))
                            : ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(
                                (time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                )
                              )}
                        </select>
                        {errors.diveTime && (
                          <p className="mt-1 text-sm text-red-400">{errors.diveTime.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Participants */}
                    <div>
                      <Label className="text-white">
                        <Users className="mr-2 inline h-4 w-4" />
                        Participants ({service.minParticipants}-{service.maxParticipants})
                      </Label>
                      <div className="mt-1 flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-full border-white/20"
                          onClick={() =>
                            setValue(
                              'participants',
                              Math.max(service.minParticipants, participants - 1)
                            )
                          }
                          disabled={participants <= service.minParticipants}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center text-2xl font-bold text-white">
                          {participants}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-full border-white/20"
                          onClick={() =>
                            setValue(
                              'participants',
                              Math.min(service.maxParticipants, participants + 1)
                            )
                          }
                          disabled={participants >= service.maxParticipants}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Contact Information</h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-white">
                            <User className="mr-2 inline h-4 w-4" />
                            First Name
                          </Label>
                          <Input
                            {...register('guestFirstName')}
                            className="mt-1 border-white/10 bg-white/5 text-white"
                            placeholder="John"
                          />
                          {errors.guestFirstName && (
                            <p className="mt-1 text-sm text-red-400">
                              {errors.guestFirstName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-white">Last Name</Label>
                          <Input
                            {...register('guestLastName')}
                            className="mt-1 border-white/10 bg-white/5 text-white"
                            placeholder="Doe"
                          />
                          {errors.guestLastName && (
                            <p className="mt-1 text-sm text-red-400">
                              {errors.guestLastName.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-white">
                            <Mail className="mr-2 inline h-4 w-4" />
                            Email
                          </Label>
                          <Input
                            {...register('guestEmail')}
                            type="email"
                            className="mt-1 border-white/10 bg-white/5 text-white"
                            placeholder="john@example.com"
                          />
                          {errors.guestEmail && (
                            <p className="mt-1 text-sm text-red-400">{errors.guestEmail.message}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-white">
                            <Phone className="mr-2 inline h-4 w-4" />
                            Phone (optional)
                          </Label>
                          <Input
                            {...register('guestPhone')}
                            type="tel"
                            className="mt-1 border-white/10 bg-white/5 text-white"
                            placeholder="+33 6 12 34 56 78"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white">Special Requests (optional)</Label>
                        <textarea
                          {...register('specialRequests')}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                          rows={3}
                          placeholder="Any dietary requirements, equipment needs, or other requests..."
                        />
                      </div>
                    </div>

                    {/* Extras */}
                    {service.extras.length > 0 && (
                      <>
                        <Separator className="bg-white/10" />
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white">Extras & Add-ons</h3>

                          {service.extras.map((extra) => {
                            const qty = selectedExtras[extra.id] || 0;
                            const isSelected = qty > 0;

                            return (
                              <div
                                key={extra.id}
                                className={`rounded-xl border p-4 transition-colors ${
                                  isSelected
                                    ? 'border-cyan-500 bg-cyan-500/10'
                                    : 'border-white/10 bg-white/5'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleExtra(extra.id)}
                                      disabled={extra.isRequired}
                                    />
                                    <div>
                                      <p className="font-medium text-white">
                                        {getLocalized(extra.name)}
                                        {extra.isRequired && (
                                          <span className="ml-2 text-xs text-amber-400">
                                            Required
                                          </span>
                                        )}
                                      </p>
                                      {extra.description ? (
                                        <p className="text-sm text-white/60">
                                          {getLocalized(extra.description)}
                                        </p>
                                      ) : null}
                                      <p className="mt-1 text-sm text-cyan-400">
                                        {formatPrice(extra.price)}
                                        {extra.multiplyByPax && ' / person'}
                                      </p>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border-white/20"
                                        onClick={() => updateExtraQuantity(extra.id, -1)}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center text-white">{qty}</span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border-white/20"
                                        onClick={() => updateExtraQuantity(extra.id, 1)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Coupon Code */}
                    <div>
                      <Label className="text-white">Coupon Code (optional)</Label>
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="mt-1 border-white/10 bg-white/5 text-white uppercase"
                        placeholder="SUMMER2026"
                      />
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Terms */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        {...register('acceptTerms')}
                        onCheckedChange={(checked) => setValue('acceptTerms', !!checked)}
                      />
                      <div className="text-sm text-white/70">
                        I accept the{' '}
                        <Link href="/terms" className="text-cyan-400 hover:underline">
                          Terms & Conditions
                        </Link>{' '}
                        and the center&apos;s{' '}
                        <span className="text-white">
                          {service.center.cancellationPolicy.toLowerCase()} cancellation policy
                        </span>{' '}
                        ({service.center.cancellationHours}h notice required).
                      </div>
                    </div>
                    {errors.acceptTerms && (
                      <p className="text-sm text-red-400">{errors.acceptTerms.message}</p>
                    )}

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-cyan-500 py-6 text-lg font-semibold text-slate-900 hover:bg-cyan-400"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay {formatPrice(totalPrice)}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-24"
            >
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Service */}
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-white">{getLocalized(service.name)}</p>
                      <p className="text-sm text-white/60">
                        {participants} participant{participants > 1 ? 's' : ''} ×{' '}
                        {formatPrice(service.price)}
                        {service.pricePerPerson ? '/person' : ''}
                      </p>
                    </div>
                    <p className="font-medium text-white">{formatPrice(basePrice)}</p>
                  </div>

                  {/* Extras */}
                  {Object.entries(selectedExtras).map(([extraId, qty]) => {
                    if (qty === 0) return null;
                    const extra = service.extras.find((e) => e.id === extraId);
                    if (!extra) return null;

                    const extraTotal = extra.multiplyByPax
                      ? extra.price * qty * participants
                      : extra.price * qty;

                    return (
                      <div key={extraId} className="flex justify-between text-sm">
                        <div>
                          <p className="text-white/70">{getLocalized(extra.name)}</p>
                          <p className="text-white/50">
                            {qty}× {formatPrice(extra.price)}
                            {extra.multiplyByPax && ` × ${participants}`}
                          </p>
                        </div>
                        <p className="text-white/70">{formatPrice(extraTotal)}</p>
                      </div>
                    );
                  })}

                  <Separator className="bg-white/10" />

                  {/* Total */}
                  <div className="flex justify-between text-lg">
                    <p className="font-semibold text-white">Total</p>
                    <p className="font-bold text-cyan-400">{formatPrice(totalPrice)}</p>
                  </div>

                  {/* Info */}
                  <div className="rounded-lg bg-blue-500/10 p-3 text-sm">
                    <div className="flex gap-2">
                      <Info className="h-4 w-4 shrink-0 text-blue-400" />
                      <div className="text-blue-300">
                        <p className="font-medium">Secure Payment</p>
                        <p className="text-blue-300/70">
                          Powered by Stripe. Your card details are never stored on our servers.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <Check className="h-4 w-4 text-green-400" />
                      Instant confirmation
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Check className="h-4 w-4 text-green-400" />
                      Free cancellation ({service.center.cancellationHours}h notice)
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Check className="h-4 w-4 text-green-400" />
                      {service.durationMinutes} min duration
                    </div>
                    {service.equipmentIncluded && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Check className="h-4 w-4 text-green-400" />
                        Equipment included
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
