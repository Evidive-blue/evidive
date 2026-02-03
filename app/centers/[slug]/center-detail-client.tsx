'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  Check,
  Clock,
  Users,
  Globe,
  Mail,
  Phone,
  Calendar,
  Award,
  Languages,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  minParticipants: number;
  maxParticipants: number;
  minCertification: string | null;
  equipmentIncluded: boolean;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: Date;
  diver: {
    displayName: string | null;
    firstName: string | null;
    avatarUrl: string | null;
  };
}

interface Worker {
  id: string;
  name: string;
  photoUrl: string | null;
  certifications: string[];
  languages: string[];
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
  equipmentRental: boolean;
  logoUrl: string | null;
  featuredImage: string | null;
  photos: string[];
  verified: boolean;
  rating: Decimal;
  reviewCount: number;
  services: Service[];
  reviews: Review[];
  workers: Worker[];
  _count: {
    reviews: number;
    bookings: number;
  };
}

interface CenterDetailClientProps {
  center: Center;
}

export function CenterDetailClient({ center }: CenterDetailClientProps) {
  const { locale } = useLocale();
  const t = useTranslations('centers.directory');
  const tDetail = useTranslations('centers.detail');
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const getLocalized = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, string>;
      return obj[locale] || obj.en || obj.fr || Object.values(obj)[0] || '';
    }
    return '';
  };

  const formatPrice = (price: Decimal, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(Number(price));
  };

  const rating = Number(center.rating);

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      {/* Hero Section */}
      <section className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-surface to-ocean-deep">
          {center.featuredImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-50"
              style={{ backgroundImage: `url(${center.featuredImage})` }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl opacity-20">🤿</span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/centers">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToCenters')}
            </Button>
          </Link>
        </div>
      </section>

      <div className="container-custom -mt-24 relative z-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Logo */}
                    <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {center.logoUrl ? (
                        <img src={center.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">🏊</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                          {getLocalized(center.name)}
                        </h1>
                        {center.verified && (
                          <Badge variant="success" className="gap-1">
                            <Check className="w-3 h-3" />
                            {t('verified')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-white/60 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{center.city}, {center.country}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-white">{rating.toFixed(1)}</span>
                            <span className="text-white/50">({center._count.reviews} reviews)</span>
                          </div>
                        )}
                        <span className="text-white/50">{center._count.bookings} bookings</span>
                      </div>
                      
                      {center.shortDescription ? (
                        <p className="mt-4 text-white/70">
                          {getLocalized(center.shortDescription)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Description */}
            {center.description ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                <CardHeader>
                    <CardTitle>{tDetail('sections.about')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {getLocalized(center.description)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}

            {/* Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    {tDetail('sections.services')} ({center.services.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {center.services.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {tDetail('empty.services')}
                    </p>
                  ) : (
                    center.services.map((service) => (
                      <div
                        key={service.id}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedService === service.id
                            ? 'border-cyan-400 bg-cyan-400/10'
                            : 'border-border hover:border-cyan-400/50'
                        }`}
                        onClick={() => setSelectedService(
                          selectedService === service.id ? null : service.id
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {String(getLocalized(service.name))}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {service.durationMinutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {service.minParticipants}-{service.maxParticipants} pers.
                              </span>
                              {service.equipmentIncluded && (
                                <Badge variant="secondary" className="text-xs">
                                  {tDetail('equipmentIncluded')}
                                </Badge>
                              )}
                            </div>
                            
                            {selectedService === service.id && service.description ? (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 text-sm text-muted-foreground"
                              >
                                {getLocalized(service.description)}
                              </motion.p>
                            ) : null}
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-cyan-400">
                              {formatPrice(service.price, service.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">{tDetail('perPerson')}</p>
                          </div>
                        </div>
                        
                        {selectedService === service.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 pt-4 border-t border-border"
                          >
                            <Link href={`/book/${center.slug}/${service.id}`}>
                              <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                                {tDetail('bookNow')}
                                <ChevronRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    {tDetail('sections.reviews')} ({center._count.reviews})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {center.reviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {tDetail('empty.reviews')}
                    </p>
                  ) : (
                    center.reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl bg-muted/30">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {review.diver.avatarUrl ? (
                              <img src={review.diver.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">👤</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {review.diver.displayName || review.diver.firstName || tDetail('anonymous')}
                              </span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.title && (
                              <p className="font-medium mt-1">{review.title}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {review.comment}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>{tDetail('sections.contact')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <a
                      href={`mailto:${center.email}`}
                      className="flex items-center gap-3 text-sm hover:text-cyan-400 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {center.email}
                    </a>
                    <a
                      href={`tel:${center.phone}`}
                      className="flex items-center gap-3 text-sm hover:text-cyan-400 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {center.phone}
                    </a>
                    {center.website && (
                      <a
                        href={center.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm hover:text-cyan-400 transition-colors"
                      >
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        {tDetail('website')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{tDetail('address')}</p>
                    <p className="text-sm">
                      {center.address}<br />
                      {center.city}, {center.region && `${center.region}, `}{center.country}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Certifications */}
            {center.certifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-cyan-400" />
                      {tDetail('sections.certifications')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {center.certifications.map((cert) => (
                        <Badge key={cert} variant="secondary">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Languages */}
            {center.languagesSpoken.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Languages className="w-5 h-5 text-cyan-400" />
                      {tDetail('sections.languages')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {center.languagesSpoken.map((lang) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Team */}
            {center.workers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{tDetail('sections.team')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {center.workers.map((worker) => (
                      <div key={worker.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {worker.photoUrl ? (
                            <img src={worker.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>👤</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{worker.name}</p>
                          {worker.certifications.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {worker.certifications.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
