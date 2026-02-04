'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield,
  Heart,
  Star,
  Users,
  Globe,
  Waves,
  Target,
  Compass,
  Award,
  ArrowRight,
  MapPin,
  Zap,
  Check,
  Eye,
  MessageCircle,
  Instagram,
  Handshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LightRays } from '@/components/effects/floating-particles';
import { useTranslations } from '@/lib/i18n/use-translations';
import { useLocale } from '@/lib/i18n/locale-provider';
import { getNestedValue } from '@/lib/i18n/get-messages';

// Floating bubbles effect
function FloatingBubbles() {
  return (
    <>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
            left: `${Math.random() * 100}%`,
            bottom: '-20px',
          }}
          animate={{
            y: [0, -800],
            opacity: [0, 0.6, 0],
            scale: [1, 0.5],
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  );
}

export default function AboutPage() {
  const t = useTranslations('about');
  const { messages } = useLocale();
  
  // Get founders array safely
  const founders = (() => {
    const members = getNestedValue(messages, 'about.founders.members');
    return Array.isArray(members) ? members as Array<{ name: string; role: string }> : [];
  })();
  
  // Get features array safely
  const featuresItems = (() => {
    const items = getNestedValue(messages, 'about.features.items');
    return Array.isArray(items) ? items as Array<{ title: string; description: string }> : [];
  })();

  // Get mission points array safely
  const missionPoints = (() => {
    const points = getNestedValue(messages, 'about.mission.points');
    return Array.isArray(points) ? points as string[] : [];
  })();

  const values = [
    {
      key: 'trust',
      icon: Shield,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      key: 'safety',
      icon: Heart,
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      key: 'experience',
      icon: Star,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      key: 'community',
      icon: Users,
      gradient: 'from-emerald-500 to-teal-600',
    },
  ];

  const timeline = [
    { year: '2023', icon: Target, event: t('story.timeline.idea') },
    { year: '2024', icon: Compass, event: t('story.timeline.launch') },
    { year: '2025', icon: Globe, event: t('story.timeline.expansion') },
    { year: '2026', icon: Award, event: t('story.timeline.partners') },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center pt-20">
        <LightRays className="opacity-20" />
        <FloatingBubbles />
        
        {/* Background gradient orbs */}
        <motion.div
          className="absolute -right-40 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -left-40 bottom-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 backdrop-blur-sm"
          >
            <Waves className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">{t('hero.badge')}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
          >
            {t('hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mb-12 max-w-2xl text-lg text-white/70 sm:text-xl"
          >
            {t('hero.subtitle')}
          </motion.p>

        </div>

        </section>

      {/* Mission Section */}
      <section className="relative py-24 lg:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Image/Visual */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-1">
                <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-slate-900/80">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                    className="relative h-48 w-48"
                  >
                    <Globe className="h-full w-full text-cyan-500/30" />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <MapPin className="h-12 w-12 text-cyan-400" />
                    </motion.div>
                  </motion.div>
                </div>
              </div>
              
              {/* Floating card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-6 -right-6 rounded-2xl border border-white/10 bg-slate-900/90 p-4 backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
                    <Waves className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t('stats.countries')}</p>
                    <p className="text-xs text-white/60">25+</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="mb-4 inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-400">
                {t('mission.badge')}
              </span>
              <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
                {t('mission.title')}
              </h2>
              <p className="mb-6 text-lg text-white/70">
                {t('mission.description')}
              </p>
              <ul className="space-y-3">
                {missionPoints.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-white/80"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20">
                      <ArrowRight className="h-3 w-3 text-cyan-400" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        
        <div className="container relative mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-400">
              {t('values.title')}
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {t('values.title')}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/60">
              {t('values.subtitle')}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/30 hover:bg-white/10">
                  <div
                    className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${value.gradient} shadow-lg`}
                  >
                    <value.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {t(`values.items.${value.key}.title`)}
                  </h3>
                  <p className="text-sm text-white/60">
                    {t(`values.items.${value.key}.description`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="relative py-24 lg:py-32">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-400">
              {t('story.title')}
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {t('story.title')}
            </h2>
            <p className="text-lg text-white/60">
              {t('story.subtitle')}
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-cyan-500/50 via-blue-500/50 to-transparent md:block" />

            {/* Timeline items */}
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`relative mb-12 flex flex-col items-center md:items-stretch ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div
                  className={`w-full text-center md:w-5/12 ${
                    index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                  >
                    <span className="mb-2 inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-bold text-cyan-400">
                      {item.year}
                    </span>
                    <p className="text-white/80">{item.event}</p>
                  </motion.div>
                </div>

                {/* Center dot */}
                <div className="mb-6 flex w-full items-center justify-center md:absolute md:left-1/2 md:mb-0 md:w-auto md:-translate-x-1/2">
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-900 bg-gradient-to-br from-cyan-500 to-blue-600"
                  >
                    <item.icon className="h-5 w-5 text-white" />
                  </motion.div>
                </div>

                {/* Empty space */}
                <div className="hidden md:block md:w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
        
        <div className="container relative mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-purple-500/10 px-3 py-1 text-sm text-purple-400">
              {t('founders.badge')}
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {t('founders.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {founders.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-3xl font-bold text-purple-300">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-white/60">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="relative py-24 lg:py-32">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="mb-4 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400">
              {t('vision.badge')}
            </span>
            <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
              {t('vision.title')}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              {t('vision.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />
        
        <div className="container relative mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {t('features.title')}
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/20' },
              { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
              { icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
              { icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/20' },
            ].map((feature, index) => {
              const item = featuresItems[index];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{item?.title}</h3>
                  <p className="text-sm text-white/60">{item?.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />
        
        <div className="container relative mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {t('team.title')}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
              {t('team.description')}
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/centers">
                <Button
                  size="lg"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                >
                  <Compass className="mr-2 h-5 w-5" />
                  {t('cta.explore')}
                </Button>
              </Link>
              <Link href="/become-partner">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-emerald-500/30 bg-emerald-500/10 px-8 text-emerald-400 hover:bg-emerald-500/20"
                >
                  <Handshake className="mr-2 h-5 w-5" />
                  {t('cta.partner')}
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
                >
                  {t('cta.contact')}
                </Button>
              </Link>
            </div>

            {/* Social */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-12 flex items-center justify-center gap-2"
            >
              <span className="text-sm text-white/50">{t('social.title')}</span>
              <a
                href="https://www.instagram.com/evidive.blue/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-sm text-pink-400 transition-colors hover:bg-pink-500/20"
              >
                <Instagram className="h-4 w-4" />
                {t('social.instagram')}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
