'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  Percent,
  Info,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminSettingsClientProps {
  initialCommissionRate: number;
}

export function AdminSettingsClient({ initialCommissionRate }: AdminSettingsClientProps) {

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au dashboard
          </Link>

          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-cyan-400" />
            Paramètres globaux
          </h1>
          <p className="mt-1 text-white/60">
            Gérez les paramètres de la plateforme
          </p>
        </div>

        {/* Commission Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Percent className="h-5 w-5 text-green-400" />
                Gestion des commissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info Banner */}
              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-6">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-cyan-300 font-medium mb-2">
                      Gestion personnalisée par centre
                    </p>
                    <p className="text-sm text-cyan-200/80 mb-3">
                      Les taux de commission sont configurés individuellement pour chaque centre de plongée. 
                      Cela permet une flexibilité et une négociation au cas par cas.
                    </p>
                    <p className="text-xs text-cyan-200/60">
                      Taux par défaut : {initialCommissionRate}% (appliqué aux nouveaux centres)
                    </p>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-white/80">Comment ça marche ?</p>
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex gap-3">
                    <span className="text-green-400">•</span>
                    <p>Le taux de commission est prélevé sur chaque réservation payée</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400">•</span>
                    <p>Il s'applique sur le montant total (service + extras)</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400">•</span>
                    <p>Chaque centre a son propre taux personnalisable</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400">•</span>
                    <p>Les nouveaux centres reçoivent le taux par défaut ({initialCommissionRate}%)</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <Link href="/admin/centers">
                <Button className="w-full rounded-xl bg-green-500 hover:bg-green-600 gap-2">
                  <Building2 className="h-4 w-4" />
                  Gérer les taux par centre
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Settings Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Autres paramètres</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/60 text-center py-8">
                D'autres paramètres seront ajoutés ici prochainement
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
