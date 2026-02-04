'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Mail,
  Phone,
  Share2,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/lib/i18n/locale-provider';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface Booking {
  id: string;
  reference: string;
  diveDate: Date;
  diveTime: Date;
  participants: number;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string;
  guestPhone: string | null;
  totalPrice: number;
  currency: string;
  status: string;
  paymentStatus: string;
  service: {
    name: unknown;
    durationMinutes: number;
  };
  center: {
    name: unknown;
    slug: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    address: string;
  };
  extras: Array<{
    extra: { name: unknown };
    quantity: number;
    totalPrice: number;
  }>;
}

interface BookingSuccessClientProps {
  booking: Booking;
}

export function BookingSuccessClient({ booking }: BookingSuccessClientProps) {
  const { locale } = useLocale();

  // Trigger confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#22c55e', '#f59e0b'],
    });
  }, []);

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
      currency: booking.currency,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return new Date(time).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: `Dive Booking - ${getLocalized(booking.service.name)}`,
      text: `I just booked a dive at ${getLocalized(booking.center.name)}! Reference: ${booking.reference}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        alert('Booking details copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-16 pt-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20"
          >
            <CheckCircle className="h-12 w-12 text-green-500" />
          </motion.div>

          <h1 className="text-3xl font-bold text-white">Booking Confirmed!</h1>
          <p className="mt-2 text-white/60">
            Your dive experience is booked. Check your email for confirmation.
          </p>
        </motion.div>

        {/* Booking Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="border-cyan-500/30 bg-cyan-500/10">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-cyan-400">Booking Reference</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-white">
                {booking.reference}
              </p>
              <p className="mt-2 text-sm text-white/60">
                Save this reference for your records
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service */}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {getLocalized(booking.service.name)}
                </h3>
                <p className="text-white/60">{booking.service.durationMinutes} min duration</p>
              </div>

              {/* Date & Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-white/60">Date</p>
                    <p className="font-medium text-white">{formatDate(booking.diveDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-white/60">Time</p>
                    <p className="font-medium text-white">{formatTime(booking.diveTime)}</p>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm text-white/60">Participants</p>
                  <p className="font-medium text-white">
                    {booking.participants} person{booking.participants > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Center */}
              <div>
                <h3 className="mb-3 font-semibold text-white">
                  {getLocalized(booking.center.name)}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-white/50" />
                    <p className="text-white/70">
                      {booking.center.address}, {booking.center.city}, {booking.center.country}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-white/50" />
                    <a href={`mailto:${booking.center.email}`} className="text-cyan-400 hover:underline">
                      {booking.center.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-white/50" />
                    <a href={`tel:${booking.center.phone}`} className="text-cyan-400 hover:underline">
                      {booking.center.phone}
                    </a>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Payment Summary */}
              <div>
                <div className="flex justify-between text-lg">
                  <span className="text-white/60">Total Paid</span>
                  <span className="font-bold text-green-400">{formatPrice(booking.totalPrice)}</span>
                </div>
                <p className="mt-1 text-sm text-green-400/70">
                  <CheckCircle className="mr-1 inline h-4 w-4" />
                  Payment successful
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1 rounded-xl border-white/20"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Link href={`/centers/${booking.center.slug}`} className="flex-1">
            <Button variant="outline" className="w-full rounded-xl border-white/20">
              View Center
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full rounded-xl bg-cyan-500 text-slate-900 hover:bg-cyan-400">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">What&apos;s Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/70">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                  1
                </span>
                <p>Check your email for the confirmation and e-ticket</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                  2
                </span>
                <p>Arrive at the center 15 minutes before your dive time</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                  3
                </span>
                <p>Bring your certification card and photo ID</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                  4
                </span>
                <p>Enjoy your dive adventure!</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
