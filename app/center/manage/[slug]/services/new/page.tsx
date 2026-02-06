'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save, Clock, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n/use-translations';

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;

const DEFAULT_TIMES = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

export default function NewServicePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const t = useTranslations('centerServices.new');
  const tForm = useTranslations('centerServices.form');
  const tErr = useTranslations('centerServices.errors');
  const tCommon = useTranslations('common');
  const tDaysShort = useTranslations('centerCalendar.daysShort');
  const tCertifications = useTranslations('centerServices.certifications');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'EUR',
    durationMinutes: '60',
    minParticipants: '1',
    maxParticipants: '6',
    minCertification: '',
    minAge: '10',
    maxDepth: '',
    equipmentIncluded: false,
    equipmentDetails: '',
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    startTimes: ['09:00', '14:00'],
  });

  const certificationOptions: Array<{ value: string; label: string }> = [
    { value: 'Open Water', label: tCertifications('ow') },
    { value: 'Advanced Open Water', label: tCertifications('aow') },
    { value: 'Rescue Diver', label: tCertifications('rescue') },
    { value: 'Divemaster', label: tCertifications('dm') },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = tErr('name_required');

    if (!form.price) newErrors.price = tErr('price_required');
    else if (parseFloat(form.price) <= 0) newErrors.price = tErr('price_positive');

    if (!form.durationMinutes || parseInt(form.durationMinutes) <= 0) {
      newErrors.durationMinutes = tErr('duration_positive');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/centers/${slug}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: form.name, fr: form.name },
          description: form.description ? { en: form.description, fr: form.description } : null,
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
        }),
      });

      if (response.ok) {
        router.push(`/center/manage/${slug}?tab=services`);
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || tErr('server_error') });
      }
    } catch {
      setErrors({ submit: tCommon('error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const toggleTime = (time: string) => {
    setForm(prev => ({
      ...prev,
      startTimes: prev.startTimes.includes(time)
        ? prev.startTimes.filter(t => t !== time)
        : [...prev.startTimes, time].sort(),
    }));
  };

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/center/manage/${slug}`}
            className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToCenter')}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <p className="mt-2 text-white/60">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">{tForm('basicInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    {tForm('name')} *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('examples.namePlaceholder')}
                    className={cn(
                      'h-12 rounded-xl border-white/10 bg-white/5 text-white',
                      errors.name && 'border-red-500'
                    )}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    {tForm('description')}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('examples.descriptionPlaceholder')}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Duration */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  {tForm('pricing')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {t('pricePerPersonRequired')} *
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="50.00"
                        className={cn(
                          'h-12 rounded-xl border-white/10 bg-white/5 text-white pr-16',
                          errors.price && 'border-red-500'
                        )}
                      />
                      <select
                        value={form.currency}
                        onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent text-white/60 outline-none"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {tForm('duration')} *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        type="number"
                        min="15"
                        step="15"
                        value={form.durationMinutes}
                        onChange={(e) => setForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                        className={cn(
                          'h-12 rounded-xl border-white/10 bg-white/5 text-white pl-10',
                          errors.durationMinutes && 'border-red-500'
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {tForm('maxDepth')}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={form.maxDepth}
                      onChange={(e) => setForm(prev => ({ ...prev, maxDepth: e.target.value }))}
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
                  {tForm('capacity')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {tForm('minParticipants')}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={form.minParticipants}
                      onChange={(e) => setForm(prev => ({ ...prev, minParticipants: e.target.value }))}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {tForm('maxParticipants')}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={form.maxParticipants}
                      onChange={(e) => setForm(prev => ({ ...prev, maxParticipants: e.target.value }))}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {tForm('minAge')}
                    </label>
                    <Input
                      type="number"
                      min="8"
                      value={form.minAge}
                      onChange={(e) => setForm(prev => ({ ...prev, minAge: e.target.value }))}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {tForm('minCertification')}
                    </label>
                    <select
                      value={form.minCertification}
                      onChange={(e) => setForm(prev => ({ ...prev, minCertification: e.target.value }))}
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
                    >
                      <option value="">{tForm('noCertification')}</option>
                      {certificationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.equipmentIncluded}
                      onChange={(e) => setForm(prev => ({ ...prev, equipmentIncluded: e.target.checked }))}
                      className="h-5 w-5 rounded border-white/20 bg-white/5 text-cyan-500"
                    />
                    <span className="text-white/70">{tForm('equipmentIncluded')}</span>
                  </label>
                </div>

                {form.equipmentIncluded && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {tForm('equipmentDetails')}
                    </label>
                    <Input
                      value={form.equipmentDetails}
                      onChange={(e) => setForm(prev => ({ ...prev, equipmentDetails: e.target.value }))}
                      placeholder={tForm('equipmentDetailsPlaceholder')}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  {tForm('schedule')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-white/70">
                    {tForm('availableDays')}
                  </label>
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
                        {tDaysShort(dayKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-white/70">
                    {tForm('startTimes')}
                  </label>
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
                  <p className="mt-2 text-xs text-white/40">
                    {t('toggleHint')}
                  </p>
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
              <Link href={`/center/manage/${slug}`} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-white/10 bg-white/5"
                >
                  {tCommon('cancel')}
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
                {t('createCta')}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
