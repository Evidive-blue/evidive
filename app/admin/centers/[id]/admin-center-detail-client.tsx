'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Star,
  DollarSign,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Trash2,
  Clock,
  Package,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Decimal } from '@prisma/client/runtime/library';
import { toast } from 'sonner';

interface Owner {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: Date;
}

interface Service {
  id: string;
  name: unknown;
  price: Decimal;
  currency: string;
  durationMinutes: number;
  isActive: boolean;
}

interface Booking {
  id: string;
  reference: string;
  diveDate: Date;
  totalPrice: Decimal;
  status: string;
  paymentStatus: string;
  guestEmail: string;
  service: { name: unknown } | null;
  diver: { displayName: string | null; email: string } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: Date;
  diver: { displayName: string | null; email: string };
}

interface Center {
  id: string;
  slug: string;
  name: unknown;
  description: unknown;
  shortDescription: unknown;
  address: string;
  city: string;
  region: string | null;
  country: string;
  email: string;
  phone: string;
  website: string | null;
  certifications: string[];
  languagesSpoken: string[];
  status: string;
  verified: boolean;
  rating: Decimal;
  reviewCount: number;
  bookingCount: number;
  viewCount: number;
  createdAt: Date;
  approvedAt: Date | null;
  commissionRate: Decimal;
  owner: Owner;
  services: Service[];
  bookings: Booking[];
  reviews: Review[];
  _count: {
    bookings: number;
    reviews: number;
    services: number;
  };
}

interface AdminCenterDetailClientProps {
  center: Center;
  totalRevenue: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  APPROVED: 'bg-green-500/20 text-green-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  SUSPENDED: 'bg-gray-500/20 text-gray-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  PAID: 'bg-emerald-500/20 text-emerald-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

export function AdminCenterDetailClient({ center, totalRevenue }: AdminCenterDetailClientProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState(Number(center.commissionRate));
  const [isEditingCommission, setIsEditingCommission] = useState(false);

  const getLocalized = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, string>;
      return obj.en || obj.fr || Object.values(obj)[0] || '';
    }
    return '';
  };

  const formatPrice = (price: Decimal | number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(Number(price));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const updateStatus = async (status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    setActionLoading(status);
    try {
      const response = await fetch(`/api/admin/centers/${center.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVerified = async () => {
    setActionLoading('verified');
    try {
      const response = await fetch(`/api/admin/centers/${center.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !center.verified }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling verified:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCenter = async () => {
    if (!confirm('Are you sure you want to delete this center? This action cannot be undone.')) {
      return;
    }

    setActionLoading('delete');
    try {
      const response = await fetch(`/api/admin/centers/${center.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/centers');
      }
    } catch (error) {
      console.error('Error deleting center:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const updateCommissionRate = async () => {
    if (commissionRate < 0 || commissionRate > 100) {
      toast.error('Le taux de commission doit être entre 0 et 100%');
      return;
    }

    setActionLoading('commission');
    try {
      const response = await fetch(`/api/admin/centers/${center.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate }),
      });

      if (response.ok) {
        toast.success('Taux de commission mis à jour');
        setIsEditingCommission(false);
        router.refresh();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating commission rate:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setActionLoading(null);
    }
  };

  const rating = Number(center.rating);

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/centers"
            className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Centers
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {getLocalized(center.name)}
                </h1>
                <Badge className={STATUS_COLORS[center.status]}>
                  {center.status}
                </Badge>
                {center.verified && (
                  <Badge variant="success" className="gap-1">
                    <Check className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-white/60 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {center.city}, {center.country}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/centers/${center.slug}`} target="_blank">
                <Button variant="outline" className="rounded-xl border-white/10 bg-white/5">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Public
                </Button>
              </Link>
              
              <Button
                onClick={toggleVerified}
                disabled={actionLoading !== null}
                variant="outline"
                className={`rounded-xl border-white/10 ${center.verified ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}
              >
                {actionLoading === 'verified' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : center.verified ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Remove Verified
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Mark Verified
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-cyan-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{center._count.bookings}</p>
                      <p className="text-xs text-white/60">Bookings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{formatPrice(totalRevenue)}</p>
                      <p className="text-xs text-white/60">Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-amber-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {rating > 0 ? rating.toFixed(1) : '-'}
                      </p>
                      <p className="text-xs text-white/60">{center._count.reviews} Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{center._count.services}</p>
                      <p className="text-xs text-white/60">Services</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Description</CardTitle>
              </CardHeader>
              <CardContent>
                {center.shortDescription ? (
                  <p className="text-white/80 font-medium mb-4">
                    {getLocalized(center.shortDescription)}
                  </p>
                ) : null}
                <p className="text-white/60 whitespace-pre-wrap">
                  {getLocalized(center.description) || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Services ({center.services.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {center.services.length === 0 ? (
                  <p className="text-white/60 text-center py-4">No services yet</p>
                ) : (
                  <div className="space-y-3">
                    {center.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                      >
                        <div>
                          <p className="font-medium text-white">{getLocalized(service.name)}</p>
                          <div className="flex items-center gap-3 text-xs text-white/50">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {service.durationMinutes} min
                            </span>
                            <Badge variant={service.isActive ? 'success' : 'secondary'} className="text-xs">
                              {service.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <p className="font-bold text-cyan-400">
                          {formatPrice(service.price, service.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {center.bookings.length === 0 ? (
                  <p className="text-white/60 text-center py-4">No bookings yet</p>
                ) : (
                  <div className="space-y-3">
                    {center.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                      >
                        <div>
                          <p className="font-mono text-sm text-cyan-400">#{booking.reference}</p>
                          <p className="text-sm text-white">
                            {booking.diver?.displayName || booking.guestEmail}
                          </p>
                          <p className="text-xs text-white/50">{formatDate(booking.diveDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">{formatPrice(booking.totalPrice)}</p>
                          <Badge className={STATUS_COLORS[booking.status]} >
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {center.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => updateStatus('APPROVED')}
                      disabled={actionLoading !== null}
                      className="w-full rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    >
                      {actionLoading === 'APPROVED' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Approve Center
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => updateStatus('REJECTED')}
                      disabled={actionLoading !== null}
                      className="w-full rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      {actionLoading === 'REJECTED' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Reject Center
                        </>
                      )}
                    </Button>
                  </>
                )}

                {center.status === 'APPROVED' && (
                  <Button
                    onClick={() => updateStatus('SUSPENDED')}
                    disabled={actionLoading !== null}
                    className="w-full rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                  >
                    {actionLoading === 'SUSPENDED' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Suspend Center
                      </>
                    )}
                  </Button>
                )}

                {(center.status === 'REJECTED' || center.status === 'SUSPENDED') && (
                  <Button
                    onClick={() => updateStatus('APPROVED')}
                    disabled={actionLoading !== null}
                    className="w-full rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  >
                    {actionLoading === 'APPROVED' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Approve Center
                      </>
                    )}
                  </Button>
                )}

                <Separator className="bg-white/10" />

                <Button
                  onClick={deleteCenter}
                  disabled={actionLoading !== null}
                  variant="outline"
                  className="w-full rounded-xl border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  {actionLoading === 'delete' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Center
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-white">
                    {center.owner.displayName ||
                      `${center.owner.firstName || ''} ${center.owner.lastName || ''}`.trim() ||
                      'No name'}
                  </p>
                  <p className="text-sm text-white/60">{center.owner.email}</p>
                </div>
                {center.owner.phone && (
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {center.owner.phone}
                  </p>
                )}
                <p className="text-xs text-white/40">
                  Member since {formatDate(center.owner.createdAt)}
                </p>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a href={`mailto:${center.email}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                  <Mail className="w-4 h-4" />
                  {center.email}
                </a>
                <a href={`tel:${center.phone}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                  <Phone className="w-4 h-4" />
                  {center.phone}
                </a>
                {center.website && (
                  <a href={center.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                    <Globe className="w-4 h-4" />
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-sm text-white/40 mb-1">Address</p>
                  <p className="text-sm text-white/70">
                    {center.address}<br />
                    {center.city}, {center.region && `${center.region}, `}{center.country}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Commission Rate */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-green-400" />
                  Commission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditingCommission ? (
                  <>
                    <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4">
                      <p className="text-sm text-white/60 mb-1">Taux de commission</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold text-green-400">{commissionRate}%</p>
                      </div>
                      <p className="text-xs text-white/40 mt-2">
                        Sur chaque réservation payée
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsEditingCommission(true)}
                      variant="outline"
                      className="w-full rounded-xl border-white/10 bg-white/5"
                    >
                      Modifier le taux
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-white mb-2 block text-sm">
                          Nouveau taux (%)
                        </Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                            className="h-11 bg-white/5 border-white/10 text-white pl-10 pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                            %
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-3">
                        <p className="text-xs text-cyan-300 font-medium mb-1">Exemple</p>
                        <p className="text-sm text-cyan-200/80">
                          Réservation 100€ = {(100 * commissionRate / 100).toFixed(2)}€ commission
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setCommissionRate(Number(center.commissionRate));
                          setIsEditingCommission(false);
                        }}
                        variant="outline"
                        className="flex-1 rounded-xl border-white/10 bg-white/5"
                        disabled={actionLoading === 'commission'}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={updateCommissionRate}
                        disabled={actionLoading === 'commission'}
                        className="flex-1 rounded-xl bg-green-500 hover:bg-green-600"
                      >
                        {actionLoading === 'commission' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Enregistrer'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Meta Info */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Meta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Created</span>
                  <span className="text-white">{formatDate(center.createdAt)}</span>
                </div>
                {center.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Approved</span>
                    <span className="text-white">{formatDate(center.approvedAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/50">Views</span>
                  <span className="text-white">{center.viewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">ID</span>
                  <span className="text-white/70 font-mono text-xs">{center.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
