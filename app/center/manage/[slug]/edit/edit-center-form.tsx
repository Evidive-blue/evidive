'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Save,
  Loader2,
  Facebook,
  Instagram,
  MessageCircle,
  Award,
  Languages,
  Clock,
  Leaf,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/lib/i18n/locale-provider';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/upload/image-upload';

// Dynamic import for the map to avoid SSR issues
const LocationMap = dynamic(
  () => import('@/components/centers/location-map').then((mod) => mod.LocationMap),
  { ssr: false, loading: () => <div className="h-[300px] w-full rounded-xl bg-white/5 animate-pulse" /> }
);

const editCenterSchema = z.object({
  name: z.object({
    fr: z.string().min(2, 'Le nom est requis'),
    en: z.string().optional(),
  }),
  description: z.object({
    fr: z.string().min(10, 'La description doit faire au moins 10 caractères'),
    en: z.string().optional(),
  }),
  shortDescription: z.object({
    fr: z.string().max(200, 'Maximum 200 caractères').optional(),
    en: z.string().optional(),
  }).optional(),
  address: z.string().min(5, 'L\'adresse est requise'),
  street2: z.string().optional(),
  city: z.string().min(2, 'La ville est requise'),
  region: z.string().optional(),
  country: z.string().min(2, 'Le pays est requis'),
  zip: z.string().optional(),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Téléphone invalide'),
  website: z.string().url('URL invalide').or(z.literal('')).optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  whatsapp: z.string().optional(),
  certifications: z.array(z.string()),
  languagesSpoken: z.array(z.string()),
  equipmentRental: z.boolean(),
  ecoCommitment: z.string().optional(),
  cancellationHours: z.number().min(0),
});

type EditCenterFormData = z.infer<typeof editCenterSchema>;

interface Center {
  id: string;
  slug: string;
  name: unknown;
  description: unknown;
  shortDescription: unknown;
  address: string;
  street2: string | null;
  city: string;
  region: string | null;
  country: string;
  zip: string | null;
  latitude: number;
  longitude: number;
  email: string;
  phone: string;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  whatsapp: string | null;
  certifications: string[];
  languagesSpoken: string[];
  equipmentRental: boolean;
  ecoCommitment: string | null;
  logoUrl: string | null;
  featuredImage: string | null;
  photos: string[];
  openingHours: unknown;
  cancellationPolicy: string;
  cancellationHours: number;
}

interface EditCenterFormProps {
  center: Center;
}

const CERTIFICATIONS = ['PADI', 'SSI', 'CMAS', 'NAUI', 'BSAC', 'SDI/TDI', 'FFESSM', 'RAID'];
const LANGUAGES = ['English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Chinese', 'Japanese', 'Arabic'];

export function EditCenterForm({ center }: EditCenterFormProps) {
  const router = useRouter();
  useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [activeSection, setActiveSection] = useState<'info' | 'location' | 'contact' | 'services' | 'media'>('info');
  const [mapCoordinates, setMapCoordinates] = useState({ lat: center.latitude, lng: center.longitude });
  const [featuredImage, setFeaturedImage] = useState(center.featuredImage || '');
  const [photos, setPhotos] = useState<string[]>(center.photos || []);

  const getLocalized = (value: unknown): Record<string, string> => {
    if (!value) return { fr: '', en: '' };
    if (typeof value === 'string') return { fr: value, en: value };
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, string>;
    }
    return { fr: '', en: '' };
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditCenterFormData>({
    resolver: zodResolver(editCenterSchema),
    defaultValues: {
      name: getLocalized(center.name),
      description: getLocalized(center.description),
      shortDescription: getLocalized(center.shortDescription) || { fr: '', en: '' },
      address: center.address,
      street2: center.street2 || '',
      city: center.city,
      region: center.region || '',
      country: center.country,
      zip: center.zip || '',
      email: center.email,
      phone: center.phone,
      website: center.website || '',
      facebook: center.facebook || '',
      instagram: center.instagram || '',
      whatsapp: center.whatsapp || '',
      certifications: center.certifications,
      languagesSpoken: center.languagesSpoken,
      equipmentRental: center.equipmentRental,
      ecoCommitment: center.ecoCommitment || '',
      cancellationHours: center.cancellationHours,
    },
  });

  const selectedCertifications = watch('certifications');
  const selectedLanguages = watch('languagesSpoken');

  const toggleCertification = (cert: string) => {
    const current = selectedCertifications || [];
    if (current.includes(cert)) {
      setValue('certifications', current.filter((c) => c !== cert));
    } else {
      setValue('certifications', [...current, cert]);
    }
  };

  const toggleLanguage = (lang: string) => {
    const current = selectedLanguages || [];
    if (current.includes(lang)) {
      setValue('languagesSpoken', current.filter((l) => l !== lang));
    } else {
      setValue('languagesSpoken', [...current, lang]);
    }
  };

  const geocodeAddress = async () => {
    setIsGeocoding(true);
    try {
      const address = watch('address');
      const city = watch('city');
      const country = watch('country');
      const zip = watch('zip');

      if (!address || !city || !country) {
        toast.error('Veuillez remplir au minimum l\'adresse, la ville et le pays');
        return;
      }

      // Build full address string
      const fullAddress = [address, city, zip, country].filter(Boolean).join(', ');

      // Call Nominatim API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(fullAddress)}` +
        `&format=json` +
        `&limit=1` +
        `&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'EviDive/1.0 (contact@evidive.blue)',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();

      if (data.length === 0) {
        toast.error('Adresse non trouvée. Vérifiez les informations saisies.');
        return;
      }

      const location = data[0];
      
      // Update latitude and longitude in the API
      const updateResponse = await fetch(`/api/centers/${center.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
        }),
      });

      if (updateResponse.ok) {
        toast.success(`Localisation trouvée: ${location.display_name}`);
        setMapCoordinates({ lat: parseFloat(location.lat), lng: parseFloat(location.lon) });
        router.refresh();
      } else {
        throw new Error('Failed to update coordinates');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Erreur lors de la géolocalisation. Réessayez plus tard.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const onSubmit = async (data: EditCenterFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/centers/${center.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          featuredImage,
          photos,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update center');
      }

      toast.success('Centre mis à jour avec succès');
      router.push(`/center/manage/${center.slug}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    { id: 'info', label: 'Informations', icon: Building2 },
    { id: 'location', label: 'Localisation', icon: MapPin },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'services', label: 'Services', icon: Award },
    { id: 'media', label: 'Médias', icon: ImageIcon },
  ] as const;

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

          <h1 className="text-3xl font-bold text-white">Modifier le centre</h1>
          <p className="mt-1 text-white/60">
            Modifiez les informations de votre centre de plongée
          </p>
        </div>

        {/* Section Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Basic Info */}
          {activeSection === 'info' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Name */}
                  <div className="space-y-4">
                    <Label className="text-white">Nom du centre *</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs text-white/60">Français</Label>
                        <Input
                          {...register('name.fr')}
                          placeholder="Nom en français"
                          className="bg-white/5 border-white/10 text-white"
                        />
                        {errors.name?.fr && (
                          <p className="mt-1 text-sm text-red-400">{errors.name.fr.message}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-white/60">English</Label>
                        <Input
                          {...register('name.en')}
                          placeholder="Name in English"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="space-y-4">
                    <Label className="text-white">Tagline / Slogan</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs text-white/60">Français</Label>
                        <Input
                          {...register('shortDescription.fr')}
                          placeholder="Votre slogan"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-white/60">English</Label>
                        <Input
                          {...register('shortDescription.en')}
                          placeholder="Your tagline"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <Label className="text-white">Description *</Label>
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-xs text-white/60">Français</Label>
                        <textarea
                          {...register('description.fr')}
                          rows={4}
                          placeholder="Décrivez votre centre..."
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        {errors.description?.fr && (
                          <p className="mt-1 text-sm text-red-400">{errors.description.fr.message}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-white/60">English</Label>
                        <textarea
                          {...register('description.en')}
                          rows={4}
                          placeholder="Describe your center..."
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Eco Commitment */}
                  <div>
                    <Label className="text-white flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-400" />
                      Engagement écologique
                    </Label>
                    <textarea
                      {...register('ecoCommitment')}
                      rows={3}
                      placeholder="Décrivez vos engagements pour la protection de l'environnement..."
                      className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Location */}
          {activeSection === 'location' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Adresse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Adresse *</Label>
                    <Input
                      {...register('address')}
                      placeholder="123 Rue de la Plongée"
                      className="mt-2 bg-white/5 border-white/10 text-white"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-400">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Complément d'adresse</Label>
                    <Input
                      {...register('street2')}
                      placeholder="Bâtiment, étage..."
                      className="mt-2 bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-white">Ville *</Label>
                      <Input
                        {...register('city')}
                        placeholder="Nice"
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-400">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-white">Région</Label>
                      <Input
                        {...register('region')}
                        placeholder="Provence-Alpes-Côte d'Azur"
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-white">Pays *</Label>
                      <Input
                        {...register('country')}
                        placeholder="France"
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                      {errors.country && (
                        <p className="mt-1 text-sm text-red-400">{errors.country.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-white">Code postal</Label>
                      <Input
                        {...register('zip')}
                        placeholder="06000"
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  {/* Geocoding Button */}
                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={geocodeAddress}
                      disabled={isGeocoding}
                      className="w-full rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400"
                    >
                      {isGeocoding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Localisation en cours...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          📍 Localiser automatiquement sur la carte
                        </>
                      )}
                    </Button>
                    <p className="mt-2 text-xs text-white/50 text-center">
                      Coordonnées actuelles: {mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}
                    </p>
                  </div>                </CardContent>
              </Card>

              {/* Map Display */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                    Carte de localisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationMap
                    key={`${mapCoordinates.lat}-${mapCoordinates.lng}`}
                    latitude={mapCoordinates.lat}
                    longitude={mapCoordinates.lng}
                    centerSlug={center.slug}
                    centerName={typeof center.name === 'string' ? center.name : (center.name as any)?.fr || (center.name as any)?.en || 'Centre'}
                    onPositionChange={(lat, lng) => setMapCoordinates({ lat, lng })}
                  />
                  <p className="mt-3 text-xs text-white/60 text-center">
                    La carte se mettra à jour automatiquement après la géolocalisation
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Contact */}
          {activeSection === 'contact' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Coordonnées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email *
                      </Label>
                      <Input
                        {...register('email')}
                        type="email"
                        placeholder="contact@votrecentre.com"
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone *
                      </Label>
                      <Input
                        {...register('phone')}
                        placeholder="+33 6 12 34 56 78"
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Site web
                    </Label>
                    <Input
                      {...register('website')}
                      type="url"
                      placeholder="https://www.votrecentre.com"
                      className="mt-2 bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <Separator className="bg-white/10" />

                  <h4 className="text-sm font-medium text-white/80">Réseaux sociaux</h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-500" />
                        Facebook
                      </Label>
                      <Input
                        {...register('facebook')}
                        placeholder="https://facebook.com/..."
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        Instagram
                      </Label>
                      <Input
                        {...register('instagram')}
                        placeholder="https://instagram.com/..."
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-500" />
                      WhatsApp
                    </Label>
                    <Input
                      {...register('whatsapp')}
                      placeholder="+33 6 12 34 56 78"
                      className="mt-2 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-cyan-400" />
                    Politique d'annulation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-white">Délai d'annulation (heures)</Label>
                    <Input
                      {...register('cancellationHours', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      placeholder="48"
                      className="mt-2 bg-white/5 border-white/10 text-white w-32"
                    />
                    <p className="mt-1 text-xs text-white/50">
                      Nombre d'heures avant la plongée pour annuler sans frais
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Services */}
          {activeSection === 'services' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-cyan-400" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 mb-4">
                    Sélectionnez les certifications que vous proposez
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CERTIFICATIONS.map((cert) => (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => toggleCertification(cert)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedCertifications?.includes(cert)
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {cert}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Languages className="h-5 w-5 text-cyan-400" />
                    Langues parlées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 mb-4">
                    Sélectionnez les langues parlées par votre équipe
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedLanguages?.includes(lang)
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={watch('equipmentRental')}
                      onCheckedChange={(checked) => setValue('equipmentRental', !!checked)}
                    />
                    <span className="text-white">Location d'équipement disponible</span>
                  </label>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Médias */}
          {activeSection === 'media' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-cyan-400" />
                    Image de couverture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 mb-4">
                    Image principale affichée sur la page du centre (recommandé: 1920x1080px)
                  </p>
                  <ImageUpload
                    value={featuredImage}
                    onChange={(value) => setFeaturedImage(typeof value === 'string' ? value : '')}
                    maxFiles={1}
                  />
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-cyan-400" />
                    Galerie photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 mb-4">
                    Photos de votre centre, équipements et sites de plongée (max 10 images)
                  </p>
                  <ImageUpload
                    value={photos}
                    onChange={(value) => setPhotos(Array.isArray(value) ? value : [])}
                    maxFiles={10}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="mt-8 flex justify-end gap-4">
            <Link href={`/center/manage/${center.slug}`}>
              <Button type="button" variant="outline" className="rounded-xl border-white/10 bg-white/5">
                Annuler
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
