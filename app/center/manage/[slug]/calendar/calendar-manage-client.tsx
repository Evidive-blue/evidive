'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocale } from '@/lib/i18n/locale-provider';
import { toast } from 'sonner';

interface Booking {
  id: string;
  reference: string;
  diveDate: string;
  diveTime: string;
  participants: number;
  status: string;
  service: { name: unknown } | null;
  diver: { displayName: string | null; firstName: string | null } | null;
  guestFirstName: string | null;
}

interface Service {
  id: string;
  name: unknown;
  maxParticipants: number;
}

interface Center {
  id: string;
  slug: string;
  name: unknown;
  openingHours: unknown;
}

interface CalendarManageClientProps {
  center: Center;
  bookings: Booking[];
  services: Service[];
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  PAID: 'bg-emerald-500/20 text-emerald-400',
  COMPLETED: 'bg-gray-500/20 text-gray-400',
};

interface DayHours {
  isOpen: boolean;
  open: string;
  close: string;
}

type OpeningHoursState = Record<string, DayHours>;

export function CalendarManageClient({ center, bookings, services: _services }: CalendarManageClientProps) {
  const { locale } = useLocale();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'hours'>('calendar');
  const [isSaving, setIsSaving] = useState(false);

  // Parse existing opening hours or use defaults
  const defaultHours: OpeningHoursState = DAYS.reduce((acc, day) => {
    acc[day] = { isOpen: day !== 'sunday', open: '08:00', close: '18:00' };
    return acc;
  }, {} as OpeningHoursState);

  const parseOpeningHours = (hours: unknown): OpeningHoursState => {
    if (!hours || typeof hours !== 'object') return defaultHours;
    try {
      const parsed = hours as Record<string, unknown>;
      return DAYS.reduce((acc, day) => {
        const dayData = parsed[day] as Record<string, unknown> | undefined;
        acc[day] = {
          isOpen: dayData?.isOpen !== false,
          open: (dayData?.open as string) || '08:00',
          close: (dayData?.close as string) || '18:00',
        };
        return acc;
      }, {} as OpeningHoursState);
    } catch {
      return defaultHours;
    }
  };

  const [openingHours, setOpeningHours] = useState<OpeningHoursState>(
    parseOpeningHours(center.openingHours)
  );

  const getLocalized = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, string>;
      return obj[locale] || obj.en || obj.fr || Object.values(obj)[0] || '';
    }
    return '';
  };

  // Calendar navigation
  const goToPreviousWeek = () => {
    setCurrentDate((d) => new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const goToNextWeek = () => {
    setCurrentDate((d) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get week days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [currentDate]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      const dateKey = booking.diveDate.split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [bookings]);

  const handleHoursChange = (day: string, field: keyof DayHours, value: string | boolean) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSaveHours = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/centers/${center.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingHours }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      toast.success('Horaires enregistrés');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/center/manage/${center.slug}`}
            className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la gestion
          </Link>

          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="h-8 w-8 text-amber-400" />
            Calendrier & Disponibilités
          </h1>
          <p className="mt-1 text-white/60">{getLocalized(center.name)}</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'calendar'
                ? 'bg-cyan-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendrier
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'hours'
                ? 'bg-cyan-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            Horaires d'ouverture
          </button>
        </div>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousWeek}
                  className="rounded-xl border-white/10 bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="rounded-xl border-white/10 bg-white/5"
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextWeek}
                  className="rounded-xl border-white/10 bg-white/5"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-white font-medium">
                {weekDays[0].toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date, i) => {
                const dateKey = date.toISOString().split('T')[0];
                const dayBookings = bookingsByDate[dateKey] || [];
                const today = isToday(date);

                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 min-h-[200px] ${
                      today
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="text-center mb-2">
                      <p className="text-xs text-white/60">
                        {date.toLocaleDateString(locale, { weekday: 'short' })}
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          today ? 'text-cyan-400' : 'text-white'
                        }`}
                      >
                        {date.getDate()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      {dayBookings.slice(0, 4).map((booking) => (
                        <div
                          key={booking.id}
                          className="rounded-lg bg-white/10 p-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white/80">
                              {formatTime(booking.diveTime)}
                            </span>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 ${
                                STATUS_COLORS[booking.status] || STATUS_COLORS.PENDING
                              }`}
                            >
                              {booking.participants}
                            </Badge>
                          </div>
                          <p className="text-white truncate mt-0.5">
                            {booking.service ? getLocalized(booking.service.name) : '-'}
                          </p>
                        </div>
                      ))}
                      {dayBookings.length > 4 && (
                        <p className="text-xs text-white/40 text-center">
                          +{dayBookings.length - 4} autres
                        </p>
                      )}
                      {dayBookings.length === 0 && (
                        <p className="text-xs text-white/30 text-center py-4">
                          Aucune résa
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Opening Hours */}
        {activeTab === 'hours' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  Horaires d'ouverture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="flex items-center gap-4 py-3 border-b border-white/10 last:border-0"
                  >
                    <div className="w-32">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={openingHours[day].isOpen}
                          onCheckedChange={(checked) =>
                            handleHoursChange(day, 'isOpen', !!checked)
                          }
                        />
                        <span className="text-white font-medium">
                          {DAY_LABELS[day]}
                        </span>
                      </label>
                    </div>

                    {openingHours[day].isOpen ? (
                      <div className="flex items-center gap-3">
                        <div>
                          <Label className="text-xs text-white/60">Ouverture</Label>
                          <Input
                            type="time"
                            value={openingHours[day].open}
                            onChange={(e) =>
                              handleHoursChange(day, 'open', e.target.value)
                            }
                            className="w-28 bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <span className="text-white/40 mt-5">-</span>
                        <div>
                          <Label className="text-xs text-white/60">Fermeture</Label>
                          <Input
                            type="time"
                            value={openingHours[day].close}
                            onChange={(e) =>
                              handleHoursChange(day, 'close', e.target.value)
                            }
                            className="w-28 bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-white/40">Fermé</span>
                    )}
                  </div>
                ))}

                <div className="pt-4">
                  <Button
                    onClick={handleSaveHours}
                    disabled={isSaving}
                    className="rounded-xl bg-cyan-500 hover:bg-cyan-600"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer les horaires
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
