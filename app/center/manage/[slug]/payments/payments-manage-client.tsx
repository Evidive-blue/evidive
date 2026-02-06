'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Banknote,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/lib/i18n/locale-provider';
import { toast } from 'sonner';

interface Center {
  id: string;
  slug: string;
  name: unknown;
  stripeAccountId: string | null;
  currency: string;
}

interface Stats {
  totalRevenue: number;
  totalPaidBookings: number;
  recentBookings: number;
}

interface PaymentsManageClientProps {
  center: Center;
  stats: Stats;
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'En attente',
    color: 'bg-amber-500/20 text-amber-400',
    icon: Clock,
    description: 'Votre compte Stripe est en cours de vérification',
  },
  ACTIVE: {
    label: 'Actif',
    color: 'bg-green-500/20 text-green-400',
    icon: CheckCircle2,
    description: 'Votre compte Stripe est actif et peut recevoir des paiements',
  },
  RESTRICTED: {
    label: 'Restreint',
    color: 'bg-red-500/20 text-red-400',
    icon: AlertCircle,
    description: 'Des informations supplémentaires sont requises',
  },
  NOT_CONNECTED: {
    label: 'Non connecté',
    color: 'bg-gray-500/20 text-gray-400',
    icon: CreditCard,
    description: 'Connectez votre compte Stripe pour recevoir des paiements',
  },
};

export function PaymentsManageClient({ center, stats }: PaymentsManageClientProps) {
  const { locale } = useLocale();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<keyof typeof STATUS_CONFIG>(
    center.stripeAccountId ? 'PENDING' : 'NOT_CONNECTED'
  );

  // Fonction pour récupérer le statut Stripe
  const fetchStripeStatus = async () => {
    if (!center.stripeAccountId) return;
    
    try {
      const response = await fetch(`/api/centers/${center.slug}/stripe/status`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data.status as keyof typeof STATUS_CONFIG);
      }
    } catch (error) {
      console.error('Error fetching Stripe status:', error);
    }
  };

  // Charger le statut au montage et rafraîchir toutes les 60 secondes
  useEffect(() => {
    fetchStripeStatus();

    const interval = setInterval(() => {
      fetchStripeStatus();
    }, 60000); // 60 secondes

    return () => clearInterval(interval);
  }, [center.slug, center.stripeAccountId]);

  const getLocalized = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, string>;
      return obj[locale] || obj.en || obj.fr || Object.values(obj)[0] || '';
    }
    return '';
  };

  const formatPrice = (price: number, currency = 'EUR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(price);
  };

  const status = stripeStatus;

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_CONNECTED;
  const StatusIcon = statusConfig.icon;

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/centers/${center.slug}/stripe/connect`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create Stripe account');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de connexion Stripe');
      setIsConnecting(false);
    }
  };

  const handleOpenDashboard = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/centers/${center.slug}/stripe/dashboard`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open dashboard');
      }

      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await fetchStripeStatus();
    toast.success('Statut mis à jour');
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
            <DollarSign className="h-8 w-8 text-green-400" />
            Paiements
          </h1>
          <p className="mt-1 text-white/60">
            {getLocalized(center.name)} • Gérez votre compte Stripe
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                  <Banknote className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatPrice(stats.totalRevenue, center.currency)}
                  </p>
                  <p className="text-sm text-white/60">Revenu total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                  <CreditCard className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalPaidBookings}</p>
                  <p className="text-sm text-white/60">Réservations payées</p>
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
                  <p className="text-sm text-white/60">30 derniers jours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stripe Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-cyan-400" />
                  Compte Stripe
                </span>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-white/70">{statusConfig.description}</p>

              {center.stripeAccountId && (
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-sm text-white/60">ID du compte</p>
                  <p className="font-mono text-white">{center.stripeAccountId}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {!center.stripeAccountId ? (
                  <Button
                    onClick={handleConnectStripe}
                    disabled={isConnecting}
                    className="rounded-xl bg-[#635BFF] hover:bg-[#5851ea]"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Connecter Stripe
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleOpenDashboard}
                      disabled={isRefreshing}
                      className="rounded-xl bg-[#635BFF] hover:bg-[#5851ea]"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ouvrir le Dashboard Stripe
                    </Button>

                    {status === 'PENDING' || status === 'RESTRICTED' ? (
                      <Button
                        onClick={handleConnectStripe}
                        disabled={isConnecting}
                        variant="outline"
                        className="rounded-xl border-white/10 bg-white/5"
                      >
                        {isConnecting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Settings className="mr-2 h-4 w-4" />
                        )}
                        Compléter la configuration
                      </Button>
                    ) : null}

                    <Button
                      onClick={handleRefreshStatus}
                      disabled={isRefreshing}
                      variant="outline"
                      className="rounded-xl border-white/10 bg-white/5"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2">Comment ça marche ?</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">1.</span>
                  Connectez votre compte Stripe
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">2.</span>
                  Les clients paient via Stripe Checkout
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">3.</span>
                  Les fonds sont transférés sur votre compte
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">4.</span>
                  Commission EviDive : 5% par transaction
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2">Besoin d'aide ?</h3>
              <p className="text-sm text-white/70 mb-4">
                Si vous rencontrez des difficultés avec la configuration de votre compte Stripe,
                n'hésitez pas à nous contacter.
              </p>
              <Link href="/contact">
                <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-white/5">
                  Contacter le support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
