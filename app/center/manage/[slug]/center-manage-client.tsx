'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  Star,
  DollarSign,
  Users,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
  ExternalLink,
  Loader2,
  Check,
  ArrowLeft,
  Package,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/lib/i18n/locale-provider';
import { useTranslations } from '@/lib/i18n/use-translations';
import type { Decimal } from '@prisma/client/runtime/library';

interface Service {
  id: string;
  name: unknown;
  description: unknown;
  price: Decimal;
  currency: string;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
}

interface Worker {
  id: string;
  name: string;
  email: string | null;
  isDefault: boolean;
  isActive: boolean;
}

interface Booking {
  id: string;
  reference: string;
  diveDate: Date;
  diveTime: Date;
  participants: number;
  totalPrice: Decimal;
  status: string;
  paymentStatus: string;
  guestEmail: string;
  service: { name: unknown } | null;
  diver: { displayName: string | null; firstName: string | null; email: string } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  status: string;
  diver: { displayName: string | null; firstName: string | null };
}

interface Center {
  id: string;
  slug: string;
  name: unknown;
  status: string;
  verified: boolean;
  email: string;
  phone: string;
  city: string;
  country: string;
  mapIcon: string | null;
  services: Service[];
  workers: Worker[];
  bookings: Booking[];
  reviews: Review[];
}

interface Stats {
  totalBookings: number;
  totalReviews: number;
  totalServices: number;
  recentBookings: number;
  recentRevenue: number;
  rating: number;
}

interface CenterManageClientProps {
  center: Center;
  stats: Stats;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  APPROVED: 'bg-green-500/20 text-green-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  PAID: 'bg-emerald-500/20 text-emerald-400',
  COMPLETED: 'bg-gray-500/20 text-gray-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

// Map icon types and their SVG paths
const MAP_ICONS = {
  diver: { path: 'M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M21 9H15V22H13V16H11V22H9V9H3V7H21V9Z' },
  mask: { path: 'M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19S21.27 15.89 23 11.5C21.27 7.11 17 4 12 4M12 16.5C9.24 16.5 7 14.26 7 11.5S9.24 6.5 12 6.5 17 8.74 17 11.5 14.76 16.5 12 16.5M12 8.5C10.34 8.5 9 9.84 9 11.5S10.34 14.5 12 14.5 15 13.16 15 11.5 13.66 8.5 12 8.5Z' },
  fins: { path: 'M20.5 11H19V7C19 5.9 18.1 5 17 5H13V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V5H6C4.9 5 4 5.9 4 7V11H2.5C1.67 11 1 11.67 1 12.5S1.67 14 2.5 14H4V18C4 19.1 4.9 20 6 20H10V21.5C10 22.33 10.67 23 11.5 23S13 22.33 13 21.5V20H17C18.1 20 19 19.1 19 18V14H20.5C21.33 14 22 13.33 22 12.5S21.33 11 20.5 11Z' },
  tank: { path: 'M17 4H15V2H9V4H7C5.9 4 5 4.9 5 6V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V6C19 4.9 18.1 4 17 4M12 18C10.34 18 9 16.66 9 15V9C9 7.34 10.34 6 12 6S15 7.34 15 9V15C15 16.66 13.66 18 12 18Z' },
  anchor: { path: 'M17 15L19 17L17 19L15 17L17 15M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M12 8C14.21 8 16 9.79 16 12H14C14 10.9 13.1 10 12 10S10 10.9 10 12H8C8 9.79 9.79 8 12 8M12 14V22H10V14H7L12 9L17 14H14V22H12Z' },
  wave: { path: 'M2 12C2 12 5 8 9 8S16 12 16 12 19 16 23 16V18C19 18 16 14 16 14S13 10 9 10 2 14 2 14V12M2 18C2 18 5 14 9 14S16 18 16 18 19 22 23 22V20C19 20 16 16 16 16S13 12 9 12 2 16 2 16V18Z' },
} as const;

type MapIconType = keyof typeof MAP_ICONS;

export function CenterManageClient({ center, stats }: CenterManageClientProps) {
  const { locale } = useLocale();
  const t = useTranslations('centerManage');
  const tCommon = useTranslations('common');
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bookings' | 'reviews' | 'settings'>('overview');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<MapIconType>((center.mapIcon as MapIconType) || 'diver');
  const [isSavingIcon, setIsSavingIcon] = useState(false);

  const getLocalized = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, string>;
      return obj[locale] || obj.en || obj.fr || Object.values(obj)[0] || '';
    }
    return '';
  };

  const formatPrice = (price: Decimal | number, currency = 'EUR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(Number(price));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return new Date(time).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm(t('confirmDeleteService'))) return;
    
    setIsDeleting(serviceId);
    try {
      const response = await fetch(`/api/centers/${center.id}/services/${serviceId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveIcon = async (icon: MapIconType) => {
    setIsSavingIcon(true);
    try {
      const response = await fetch(`/api/centers/${center.slug}/icon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapIcon: icon }),
      });
      if (response.ok) {
        setSelectedIcon(icon);
      }
    } catch (error) {
      console.error('Failed to save icon:', error);
    } finally {
      setIsSavingIcon(false);
    }
  };

  const tabs = [
    { id: 'overview', label: t('tabs.overview'), icon: Building2 },
    { id: 'services', label: t('tabs.services'), icon: Package },
    { id: 'bookings', label: t('tabs.bookings'), icon: Calendar },
    { id: 'reviews', label: t('tabs.reviews'), icon: Star },
    { id: 'settings', label: t('tabs.settings'), icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToDashboard')}
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">
                  {getLocalized(center.name)}
                </h1>
                <Badge className={STATUS_COLORS[center.status] || STATUS_COLORS.PENDING}>
                  {center.status}
                </Badge>
                {center.verified && (
                  <Badge variant="success" className="gap-1">
                    <Check className="w-3 h-3" />
                    {t('verified')}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-white/60">
                {center.city}, {center.country}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Link href={`/centers/${center.slug}`} target="_blank">
                <Button variant="outline" className="rounded-xl border-white/10 bg-white/5">
                  <Eye className="mr-2 h-4 w-4" />
                  {t('viewPublicPage')}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                      <Calendar className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalBookings}</p>
                      <p className="text-sm text-white/60">{t('stats.totalBookings')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                      <DollarSign className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {formatPrice(stats.recentRevenue)}
                      </p>
                      <p className="text-sm text-white/60">{t('stats.revenue30d')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                      <Star className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {stats.rating > 0 ? stats.rating.toFixed(1) : '-'}
                      </p>
                      <p className="text-sm text-white/60">{t('stats.reviews', { count: stats.totalReviews })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                      <TrendingUp className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.recentBookings}</p>
                      <p className="text-sm text-white/60">{t('stats.bookings30d')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Bookings */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">{t('upcomingBookings.title')}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('bookings')}
                  className="text-cyan-400"
                >
                  {t('upcomingBookings.viewAll')}
                </Button>
              </CardHeader>
              <CardContent>
                {center.bookings.length === 0 ? (
                  <p className="text-center py-8 text-white/60">{t('upcomingBookings.empty')}</p>
                ) : (
                  <div className="space-y-3">
                    {center.bookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div>
                          <p className="font-medium text-white">
                            {booking.service ? getLocalized(booking.service.name) : tCommon('unnamed')}
                          </p>
                          <p className="text-sm text-white/60">
                            {booking.diver?.displayName || booking.diver?.firstName || booking.guestEmail}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-cyan-400">
                            {formatDate(booking.diveDate)} at {formatTime(booking.diveTime)}
                          </p>
                          <div className="flex items-center gap-2 justify-end mt-1">
                            <Badge className={STATUS_COLORS[booking.status]}>
                              {booking.status}
                            </Badge>
                            <span className="text-xs text-white/40">
                              {booking.participants} pax
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'services' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {t('tabs.services')} ({center.services.length})
              </h2>
              <Link href={`/center/manage/${center.slug}/services/new`}>
                <Button className="rounded-xl bg-cyan-500 hover:bg-cyan-600">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('servicesSection.addService')}
                </Button>
              </Link>
            </div>

            {center.services.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-white/20 mb-4" />
                  <p className="text-white/60 mb-4">{t('servicesSection.emptyTitle')}</p>
                  <Link href={`/center/manage/${center.slug}/services/new`}>
                    <Button className="rounded-xl bg-cyan-500 hover:bg-cyan-600">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('servicesSection.emptyCta')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {center.services.map((service) => (
                  <Card key={service.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-white">
                            {getLocalized(service.name)}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {service.durationMinutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              Max {service.maxParticipants}
                            </span>
                          </div>
                        </div>
                        <Badge variant={service.isActive ? 'success' : 'secondary'}>
                          {service.isActive ? t('servicesSection.active') : t('servicesSection.inactive')}
                        </Badge>
                      </div>
                      
                      <p className="text-lg font-bold text-cyan-400 mb-4">
                        {formatPrice(service.price, service.currency)}
                        <span className="text-sm font-normal text-white/50"> {t('servicesSection.perPerson')}</span>
                      </p>
                      
                      <div className="flex gap-2">
                        <Link href={`/center/manage/${center.slug}/services/${service.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full rounded-xl border-white/10 bg-white/5">
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            {t('servicesSection.edit')}
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                          disabled={isDeleting === service.id}
                          className="rounded-xl border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        >
                          {isDeleting === service.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white">
              {t('bookingsSection.title')} ({center.bookings.length})
            </h2>

            {center.bookings.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-white/20 mb-4" />
                  <p className="text-white/60">{t('upcomingBookings.empty')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {center.bookings.map((booking) => (
                  <Card key={booking.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-cyan-400">
                              #{booking.reference}
                            </span>
                            <Badge className={STATUS_COLORS[booking.status]}>
                              {booking.status}
                            </Badge>
                            <Badge className={STATUS_COLORS[booking.paymentStatus]}>
                              {booking.paymentStatus}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-white">
                            {booking.service ? getLocalized(booking.service.name) : tCommon('unnamed')}
                          </h3>
                          <p className="text-sm text-white/60">
                            {booking.diver?.displayName || booking.diver?.firstName || booking.guestEmail}
                            {' · '}{booking.participants} participant{booking.participants > 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium text-white">
                            {formatDate(booking.diveDate)}
                          </p>
                          <p className="text-sm text-white/60">
                            at {formatTime(booking.diveTime)}
                          </p>
                          <p className="text-lg font-bold text-cyan-400 mt-1">
                            {formatPrice(booking.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white">
              {t('reviewsSection.title')} ({stats.totalReviews})
            </h2>

            {center.reviews.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <Star className="mx-auto h-12 w-12 text-white/20 mb-4" />
                  <p className="text-white/60">{t('reviewsSection.empty')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {center.reviews.map((review) => (
                  <Card key={review.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-white">
                            {review.diver.displayName || review.diver.firstName || t('reviewsSection.anonymous')}
                          </p>
                          <p className="text-xs text-white/40">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge className={STATUS_COLORS[review.status]}>
                            {review.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-white/70">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white">{t('settingsTitle')}</h2>

            {/* Map Icon Selector */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5 text-cyan-400" />
                  {t('mapIcon.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60 mb-4">
                  {t('mapIcon.description')}
                </p>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(MAP_ICONS) as MapIconType[]).map((iconKey) => {
                    const iconData = MAP_ICONS[iconKey];
                    const isSelected = selectedIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        onClick={() => handleSaveIcon(iconKey)}
                        disabled={isSavingIcon}
                        className={`
                          flex flex-col items-center gap-2 p-3 rounded-xl transition-all
                          ${isSelected 
                            ? 'bg-cyan-500 text-white ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}
                          ${isSavingIcon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${isSelected ? 'bg-white/20' : 'bg-white/10'}
                        `}>
                          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                            <path d={iconData.path} />
                          </svg>
                        </div>
                        <span className="text-xs font-medium">{t(`mapIcons.${iconKey}`)}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 absolute -top-1 -right-1 bg-cyan-500 rounded-full p-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {isSavingIcon && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('mapIcon.saving')}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href={`/center/manage/${center.slug}/edit`}>
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <Edit className="h-8 w-8 text-cyan-400 mb-3" />
                    <h3 className="font-semibold text-white mb-1">{t('quickLinks.editCenterInfo')}</h3>
                    <p className="text-sm text-white/60">
                      {t('quickLinks.editCenterInfoDesc')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href={`/center/manage/${center.slug}/team`}>
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <Users className="h-8 w-8 text-blue-400 mb-3" />
                    <h3 className="font-semibold text-white mb-1">{t('quickLinks.manageTeam')}</h3>
                    <p className="text-sm text-white/60">
                      {t('quickLinks.manageTeamDesc')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href={`/center/manage/${center.slug}/calendar`}>
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <Calendar className="h-8 w-8 text-amber-400 mb-3" />
                    <h3 className="font-semibold text-white mb-1">{t('quickLinks.availability')}</h3>
                    <p className="text-sm text-white/60">
                      {t('quickLinks.availabilityDesc')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href={`/center/manage/${center.slug}/payments`}>
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <DollarSign className="h-8 w-8 text-green-400 mb-3" />
                    <h3 className="font-semibold text-white mb-1">{t('quickLinks.payments')}</h3>
                    <p className="text-sm text-white/60">
                      {t('quickLinks.paymentsDesc')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
