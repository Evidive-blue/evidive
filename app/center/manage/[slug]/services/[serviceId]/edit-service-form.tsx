'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save, Clock, Users, DollarSign, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n/locale-provider';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: unknown;
  description: unknown;
  price: number;
  currency: string;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  minCertification: string | null;
  minAge: number;
  maxDepth: number | null;
  equipmentIncluded: boolean;
  equipmentDetails: string | null;
  availableDays: string[];
  startTimes: string[];
  isActive: boolean;
}

interface Center {
  id: string;
  slug: string;
  name: unknown;
}

interface EditServiceFormProps {
  center: Center;
  service: Service;
}

const DAY_KEYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu',
  friday: 'Ven', saturday: 'Sam', sunday: 'Dim',
};

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
const DEFAULT_TIMES = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

const CERTIFICATION_OPTIONS = [
  { value: 'Open Water', label: 'Open Water' },
  { value: 'Advanced Open Water', label: 'Advanced Open Water' },
  { value: 'Rescue Diver', label: 'Rescue Diver' },
  { value: 'Divemaster', label: 'Divemaster' },
];

export function EditServiceForm({ center, service }: EditServiceFormProps) {
  const router = useRouter();
  const { locale: _locale } = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getLocalizedValue = (value: unknown, lang: 'en' | 'fr'): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, string>;
      return obj[lang] || '';
    }
    return '';
  };

  const [form, setForm] = useState({
    nameEn: getLocalizedValue(service.name, 'en'),
    nameFr: getLocalizedValue(service.name, 'fr'),
    descriptionEn: getLocalizedValue(service.description, 'en'),
    descriptionFr: getLocalizedValue(service.description, 'fr'),
    price: service.price.toString(),
    currency: service.currency,
    durationMinutes: service.durationMinutes.toString(),
    minParticipants: service.minParticipants.toString(),
    maxParticipants: service.maxParticipants.toString(),
    minCertification: service.minCertification || '',
    minAge: service.minAge.toString(),
    maxDepth: service.maxDepth?.toString() || '',
    equipmentIncluded: service.equipmentIncluded,
    equipmentDetails: service.equipmentDetails || '',
    availableDays: service.availableDays,
    startTimes: service.startTimes,
    isActive: service.isActive,
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.nameEn.trim()) newErrors.nameEn = 'Le nom est requis';
    if (!form.price) newErrors.price = 'Le prix est requis';
    else if (parseFloat(form.price) <= 0) newErrors.price = 'Le prix doit être positif';
    if (!form.durationMinutes || parseInt(form.durationMinutes) <= 0) {
      newErrors.durationMinutes = 'La durée doit être positive';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/centers/${center.slug}/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: form.nameEn, fr: form.nameFr || form.nameEn },
          description: form.descriptionEn 
            ? { en: form.descriptionEn, fr: form.descriptionFr || form.descriptionEn } 
            : null,
          price: parseFloat(form.price),
          currency: form.currency,
          durationMinutes: parseInt(form.durationMinutes),
          minParticipants: parseInt(form.minParticipants),
          maxParticipants: parseInt(form.maxParticipants),
          minCertification: form.minCertification || null,
          minAge: parseInt(form.minAge),
          maxDepth: form.maxDepth ? parseInt(form.maxDepth) : null,
          equipmentIncluded: form.equipmentIncluded,
          equipmentDetails: form.equipmentDetails || null,
          availableDays: form.availableDays,
          startTimes: form.startTimes,
          isActive: form.isActive,
        }),
      });

      if (response.ok) {
        toast.success('Service mis à jour');
        router.push(`/center/manage/${center.slug}?tab=services`);
        router.refresh();
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Erreur serveur' });
      }
    } catch {
      setErrors({ submit: 'Erreur de connexion' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/centers/${center.slug}/services/${service.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Service supprimé');
        router.push(`/center/manage/${center.slug}?tab=services`);
        router.refresh();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const toggleTime = (time: string) => {
    setForm((prev) => ({
      ...prev,
      startTimes: prev.startTimes.includes(time)
        ? prev.startTimes.filter((t) => t !== time)
        : [...prev.startTimes, time].sort(),
    }));
  };

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/center/manage/${center.slug}?tab=services`}
            className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux services
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Modifier le service</h1>
              <p className="mt-2 text-white/60">{form.nameEn || 'Service'}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Supprimer
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status Toggle */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isActive: !!checked }))
                    }
                  />
                  <span className="text-white font-medium">Service actif</span>
                  <span className="text-white/50 text-sm">
                    (visible et réservable par les clients)
                  </span>
                </label>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Nom (EN) *
                    </label>
                    <Input
                      value={form.nameEn}
                      onChange={(e) => setForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                      placeholder="Discovery Dive"
                      className={cn(
                        'h-12 rounded-xl border-white/10 bg-white/5 text-white',
                        errors.nameEn && 'border-red-500'
                      )}
                    />
                    {errors.nameEn && <p className="mt-1 text-xs text-red-400">{errors.nameEn}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Nom (FR)
                    </label>
                    <Input
                      value={form.nameFr}
                      onChange={(e) => setForm((prev) => ({ ...prev, nameFr: e.target.value }))}
                      placeholder="Baptême de plongée"
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Description (EN)
                  </label>
                  <textarea
                    value={form.descriptionEn}
                    onChange={(e) => setForm((prev) => ({ ...prev, descriptionEn: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Description (FR)
                  </label>
                  <textarea
                    value={form.descriptionFr}
                    onChange={(e) => setForm((prev) => ({ ...prev, descriptionFr: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Prix & Durée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Prix / personne *
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                        className={cn(
                          'h-12 rounded-xl border-white/10 bg-white/5 text-white pr-16',
                          errors.price && 'border-red-500'
                        )}
                      />
                      <select
                        value={form.currency}
                        onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent text-white/60 outline-none"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Durée (min) *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        type="number"
                        min="15"
                        step="15"
                        value={form.durationMinutes}
                        onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                        className="h-12 rounded-xl border-white/10 bg-white/5 text-white pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Prof. max (m)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={form.maxDepth}
                      onChange={(e) => setForm((prev) => ({ ...prev, maxDepth: e.target.value }))}
                      placeholder="18"
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capacity */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Capacité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Min participants</label>
                    <Input
                      type="number"
                      min="1"
                      value={form.minParticipants}
                      onChange={(e) => setForm((prev) => ({ ...prev, minParticipants: e.target.value }))}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Max participants</label>
                    <Input
                      type="number"
                      min="1"
                      value={form.maxParticipants}
                      onChange={(e) => setForm((prev) => ({ ...prev, maxParticipants: e.target.value }))}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Âge minimum</label>
                    <Input
                      type="number"
                      min="8"
                      value={form.minAge}
                      onChange={(e) => setForm((prev) => ({ ...prev, minAge: e.target.value }))}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Certification min</label>
                    <select
                      value={form.minCertification}
                      onChange={(e) => setForm((prev) => ({ ...prev, minCertification: e.target.value }))}
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
                    >
                      <option value="">Aucune</option>
                      {CERTIFICATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex cursor-pointer items-center gap-3">
                    <Checkbox
                      checked={form.equipmentIncluded}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, equipmentIncluded: !!checked }))
                      }
                    />
                    <span className="text-white/70">Équipement inclus</span>
                  </label>
                </div>

                {form.equipmentIncluded && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Détails équipement
                    </label>
                    <Input
                      value={form.equipmentDetails}
                      onChange={(e) => setForm((prev) => ({ ...prev, equipmentDetails: e.target.value }))}
                      placeholder="Masque, palmes, combinaison..."
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Disponibilités
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-white/70">Jours disponibles</label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_KEYS.map((dayKey) => (
                      <button
                        key={dayKey}
                        type="button"
                        onClick={() => toggleDay(dayKey)}
                        className={cn(
                          'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                          form.availableDays.includes(dayKey)
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        )}
                      >
                        {DAY_LABELS[dayKey]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-white/70">Horaires de départ</label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_TIMES.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => toggleTime(time)}
                        className={cn(
                          'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                          form.startTimes.includes(time)
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            {errors.submit && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Link href={`/center/manage/${center.slug}?tab=services`} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-white/10 bg-white/5"
                >
                  Annuler
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Enregistrer
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
