"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MultilingualInput, MultilingualTextarea, type MultilingualValue } from "@/components/ui/multilingual-input";
import { ImageUploader, MultipleImageUploader } from "@/components/ui/image-uploader";
import { LocationPicker } from "@/components/center/LocationPicker";
import {
  updateCenterIdentity,
  updateCenterDescription,
  updateCenterContact,
  updateCenterPractical,
  updateCenterEngagement,
  updateCenterLocation,
  updateCenterPayments,
} from "@/app/[locale]/center/profile/actions";
import {
  certificationTypes,
  languageOptions,
  paymentTypeOptions,
  defaultOpeningHours,
  type OpeningHours,
  type CertificationType,
} from "@/lib/validations/centerProfile";
import { Link } from "@/i18n/navigation";

// ============================================
// Types
// ============================================

interface CenterData {
  id: string;
  slug: string;
  name: Record<string, string>;
  logoUrl: string | null;
  featuredImage: string | null;
  photos: string[];
  shortDescription: Record<string, string> | null;
  description: Record<string, string>;
  address: string;
  street2: string | null;
  city: string;
  region: string | null;
  country: string;
  zip: string | null;
  phone: string;
  email: string;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  whatsapp: string | null;
  openingHours: Record<string, unknown> | null;
  languagesSpoken: string[];
  certifications: string[];
  equipmentRental: boolean;
  ecoCommitment: string | null;
  paymentTypes: string[];
  stripeAccountId: string | null;
  latitude: number;
  longitude: number;
  status: string;
  verified: boolean;
}

interface CenterProfileFormProps {
  initialData: CenterData;
  translations: {
    // Page
    title: string;
    subtitle: string;
    previewLink: string;
    saveSuccess: string;
    saveError: string;
    saving: string;
    save: string;
    // Sections
    sections: {
      identity: { title: string; description: string };
      description: { title: string; description: string };
      contact: { title: string; description: string };
      practical: { title: string; description: string };
      engagement: { title: string; description: string };
      payments: { title: string; description: string };
      location: { title: string; description: string };
    };
    // Fields
    fields: {
      name: string;
      logo: string;
      coverImage: string;
      gallery: string;
      shortDescription: string;
      fullDescription: string;
      address: string;
      street2: string;
      city: string;
      region: string;
      country: string;
      zip: string;
      phone: string;
      email: string;
      website: string;
      facebook: string;
      instagram: string;
      whatsapp: string;
      openingHours: string;
      languages: string;
      certifications: string;
      equipmentRental: string;
      ecoCommitment: string;
      paymentTypes: string;
      stripeAccount: string;
      stripeConnected: string;
      stripeNotConnected: string;
      stripeOnboarding: string;
      latitude: string;
      longitude: string;
    };
    // Days
    days: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
    // Other
    open: string;
    closed: string;
    yes: string;
    no: string;
  };
  locale: string;
}

// ============================================
// Section Component
// ============================================

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => Promise<void>;
  isSaving: boolean;
  saveLabel: string;
  savingLabel: string;
  successMessage: string;
  errorMessage: string;
}

function Section({
  title,
  description,
  children,
  onSave,
  isSaving,
  saveLabel,
  savingLabel,
  successMessage,
  errorMessage,
}: SectionProps) {
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");

  const handleSave = async () => {
    try {
      await onSave();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-white/60">{description}</p>
        </div>
        <div className="mt-4 flex items-center gap-3 sm:mt-0">
          {status === "success" && (
            <span className="text-sm text-green-400">{successMessage}</span>
          )}
          {status === "error" && (
            <span className="text-sm text-red-400">{errorMessage}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "rounded-xl px-5 py-2 text-sm font-semibold transition-all",
              "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {isSaving ? savingLabel : saveLabel}
          </button>
        </div>
      </div>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

// ============================================
// Main Form Component
// ============================================

export function CenterProfileForm({
  initialData,
  translations: t,
  locale,
}: CenterProfileFormProps) {
  // Form state
  const [isSaving, setIsSaving] = React.useState(false);

  // Section 1: Identity
  const [name, setName] = React.useState<MultilingualValue>(initialData.name || {});
  const [logoUrl, setLogoUrl] = React.useState<string | null>(initialData.logoUrl);
  const [featuredImage, setFeaturedImage] = React.useState<string | null>(initialData.featuredImage);
  const [photos, setPhotos] = React.useState<string[]>(initialData.photos || []);

  // Section 2: Description
  const [shortDescription, setShortDescription] = React.useState<MultilingualValue>(
    initialData.shortDescription || {}
  );
  const [description, setDescription] = React.useState<MultilingualValue>(initialData.description || {});

  // Section 3: Contact
  const [address, setAddress] = React.useState(initialData.address || "");
  const [street2, setStreet2] = React.useState(initialData.street2 || "");
  const [city, setCity] = React.useState(initialData.city || "");
  const [region, setRegion] = React.useState(initialData.region || "");
  const [country, setCountry] = React.useState(initialData.country || "");
  const [zip, setZip] = React.useState(initialData.zip || "");
  const [phone, setPhone] = React.useState(initialData.phone || "");
  const [email, setEmail] = React.useState(initialData.email || "");
  const [website, setWebsite] = React.useState(initialData.website || "");
  const [facebook, setFacebook] = React.useState(initialData.facebook || "");
  const [instagram, setInstagram] = React.useState(initialData.instagram || "");
  const [whatsapp, setWhatsapp] = React.useState(initialData.whatsapp || "");

  // Section 4: Practical
  const [openingHours, setOpeningHours] = React.useState<OpeningHours>(
    (initialData.openingHours as OpeningHours) || defaultOpeningHours
  );
  const [languagesSpoken, setLanguagesSpoken] = React.useState<string[]>(
    initialData.languagesSpoken || []
  );
  const [certifications, setCertifications] = React.useState<string[]>(
    initialData.certifications || []
  );
  const [equipmentRental, setEquipmentRental] = React.useState(initialData.equipmentRental || false);

  // Section 5: Engagement
  const [ecoCommitment, setEcoCommitment] = React.useState(initialData.ecoCommitment || "");

  // Section 6: Payments
  const [paymentTypes, setPaymentTypes] = React.useState<string[]>(
    initialData.paymentTypes || []
  );

  // Section 7: Location
  const [latitude, setLatitude] = React.useState(initialData.latitude || 0);
  const [longitude, setLongitude] = React.useState(initialData.longitude || 0);

  // ============================================
  // Save handlers
  // ============================================

  const handleSaveIdentity = async () => {
    setIsSaving(true);
    try {
      const result = await updateCenterIdentity({
        name: name as Record<string, string>,
        logoUrl,
        featuredImage,
        photos,
      });
      if (!result.success) throw new Error(result.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    setIsSaving(true);
    try {
      const result = await updateCenterDescription({
        shortDescription: shortDescription as Record<string, string>,
        description: description as Record<string, string>,
      });
      if (!result.success) throw new Error(result.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContact = async () => {
    setIsSaving(true);
    try {
      const result = await updateCenterContact({
        address,
        street2,
        city,
        region,
        country,
        zip,
        phone,
        email,
        website,
        facebook,
        instagram,
        whatsapp,
      });
      if (!result.success) throw new Error(result.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePractical = async () => {
    setIsSaving(true);
    try {
      const result = await updateCenterPractical({
        openingHours,
        languagesSpoken,
        certifications: certifications as CertificationType[],
        equipmentRental,
      });
      if (!result.success) throw new Error(result.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEngagement = async () => {
    setIsSaving(true);
    try {
      const result = await updateCenterEngagement({
        ecoCommitment,
      });
      if (!result.success) throw new Error(result.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePayments = async () => {
    setIsSaving(true);
    try {
      const result = await updateCenterPayments({
        paymentTypes,
      });
      if (!result.success) throw new Error(result.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLocation = async () => {
    setIsSaving(true);
    try {
      const result = await updateCenterLocation({
        latitude,
        longitude,
      });
      if (!result.success) throw new Error(result.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocationChange = React.useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  // ============================================
  // Render
  // ============================================

  const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-white/60">{t.subtitle}</p>
        </div>
        <Link
          href={`/centers/${initialData.slug}`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
          target="_blank"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {t.previewLink}
        </Link>
      </div>

      {/* Section 1: Identity */}
      <Section
        title={t.sections.identity.title}
        description={t.sections.identity.description}
        onSave={handleSaveIdentity}
        isSaving={isSaving}
        saveLabel={t.save}
        savingLabel={t.saving}
        successMessage={t.saveSuccess}
        errorMessage={t.saveError}
      >
        <MultilingualInput
          label={t.fields.name}
          value={name}
          onChange={setName}
          required={["fr", "en"]}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <ImageUploader
            label={t.fields.logo}
            value={logoUrl}
            onChange={setLogoUrl}
            aspectRatio="square"
            hint="Recommandé: 200x200px"
            previewClassName="h-40"
          />
          <ImageUploader
            label={t.fields.coverImage}
            value={featuredImage}
            onChange={setFeaturedImage}
            aspectRatio="landscape"
            hint="Recommandé: 1200x600px"
            previewClassName="h-40"
          />
        </div>

        <MultipleImageUploader
          label={t.fields.gallery}
          value={photos}
          onChange={setPhotos}
          maxImages={10}
          hint="Glissez pour réorganiser. La première image sera affichée en priorité."
        />
      </Section>

      {/* Section 2: Description */}
      <Section
        title={t.sections.description.title}
        description={t.sections.description.description}
        onSave={handleSaveDescription}
        isSaving={isSaving}
        saveLabel={t.save}
        savingLabel={t.saving}
        successMessage={t.saveSuccess}
        errorMessage={t.saveError}
      >
        <MultilingualTextarea
          label={t.fields.shortDescription}
          value={shortDescription}
          onChange={setShortDescription}
          rows={3}
          placeholder={{
            fr: "Brève description de votre centre (150 caractères max)...",
            en: "Brief description of your center (150 chars max)...",
            de: "Kurze Beschreibung Ihres Tauchzentrums...",
            es: "Breve descripción de su centro...",
            it: "Breve descrizione del vostro centro...",
          }}
        />

        <MultilingualTextarea
          label={t.fields.fullDescription}
          value={description}
          onChange={setDescription}
          rows={6}
          placeholder={{
            fr: "Description détaillée de votre centre, équipe, équipements...",
            en: "Detailed description of your center, team, equipment...",
            de: "Detaillierte Beschreibung Ihres Zentrums, Teams, Ausrüstung...",
            es: "Descripción detallada de su centro, equipo, equipamiento...",
            it: "Descrizione dettagliata del vostro centro, team, attrezzature...",
          }}
        />
      </Section>

      {/* Section 3: Contact */}
      <Section
        title={t.sections.contact.title}
        description={t.sections.contact.description}
        onSave={handleSaveContact}
        isSaving={isSaving}
        saveLabel={t.save}
        savingLabel={t.saving}
        successMessage={t.saveSuccess}
        errorMessage={t.saveError}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">{t.fields.address}</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Rue de la Plongée"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">{t.fields.street2}</label>
            <Input
              value={street2}
              onChange={(e) => setStreet2(e.target.value)}
              placeholder="Bâtiment, étage..."
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">{t.fields.city}</label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Nice"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">{t.fields.region}</label>
            <Input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Provence-Alpes-Côte d'Azur"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">{t.fields.country}</label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="France"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">{t.fields.zip}</label>
            <Input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="06000"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h3 className="mb-4 text-sm font-medium text-white/90">Contact</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">{t.fields.phone}</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 4 93 XX XX XX"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">{t.fields.email}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@centre.com"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">{t.fields.website}</label>
              <Input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.centre.com"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">{t.fields.whatsapp}</label>
              <Input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+33 6 XX XX XX XX"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h3 className="mb-4 text-sm font-medium text-white/90">Réseaux sociaux</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">{t.fields.facebook}</label>
              <Input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/votrecentre"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">{t.fields.instagram}</label>
              <Input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/votrecentre"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Section 4: Practical Info */}
      <Section
        title={t.sections.practical.title}
        description={t.sections.practical.description}
        onSave={handleSavePractical}
        isSaving={isSaving}
        saveLabel={t.save}
        savingLabel={t.saving}
        successMessage={t.saveSuccess}
        errorMessage={t.saveError}
      >
        {/* Opening Hours */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/90">{t.fields.openingHours}</label>
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            {dayKeys.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-24 text-sm text-white/80">
                  {t.days[day]}
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={openingHours[day]?.open || false}
                    onChange={(e) =>
                      setOpeningHours((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], open: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm text-white/60">{t.open}</span>
                </label>
                {openingHours[day]?.open && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={openingHours[day]?.openTime || "08:00"}
                      onChange={(e) =>
                        setOpeningHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], openTime: e.target.value },
                        }))
                      }
                      className="w-28 border-white/10 bg-white/5 text-white"
                    />
                    <span className="text-white/40">-</span>
                    <Input
                      type="time"
                      value={openingHours[day]?.closeTime || "18:00"}
                      onChange={(e) =>
                        setOpeningHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], closeTime: e.target.value },
                        }))
                      }
                      className="w-28 border-white/10 bg-white/5 text-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/90">{t.fields.languages}</label>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  if (languagesSpoken.includes(lang.code)) {
                    setLanguagesSpoken(languagesSpoken.filter((l) => l !== lang.code));
                  } else {
                    setLanguagesSpoken([...languagesSpoken, lang.code]);
                  }
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  languagesSpoken.includes(lang.code)
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/90">{t.fields.certifications}</label>
          <div className="flex flex-wrap gap-2">
            {certificationTypes.map((cert) => (
              <button
                key={cert}
                type="button"
                onClick={() => {
                  if (certifications.includes(cert)) {
                    setCertifications(certifications.filter((c) => c !== cert));
                  } else {
                    setCertifications([...certifications, cert]);
                  }
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  certifications.includes(cert)
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {cert}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Rental */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-white/90">{t.fields.equipmentRental}</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setEquipmentRental(true)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                equipmentRental
                  ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {t.yes}
            </button>
            <button
              type="button"
              onClick={() => setEquipmentRental(false)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                !equipmentRental
                  ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {t.no}
            </button>
          </div>
        </div>
      </Section>

      {/* Section 5: Engagement */}
      <Section
        title={t.sections.engagement.title}
        description={t.sections.engagement.description}
        onSave={handleSaveEngagement}
        isSaving={isSaving}
        saveLabel={t.save}
        savingLabel={t.saving}
        successMessage={t.saveSuccess}
        errorMessage={t.saveError}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">{t.fields.ecoCommitment}</label>
          <textarea
            value={ecoCommitment}
            onChange={(e) => setEcoCommitment(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Décrivez vos engagements éco-responsables, vos actions pour la protection des océans..."
            className={cn(
              "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white",
              "placeholder:text-white/40 transition-colors",
              "focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            )}
          />
          <p className="text-xs text-white/40">
            {ecoCommitment.length}/2000 caractères
          </p>
        </div>
      </Section>

      {/* Section 6: Payments */}
      <Section
        title={t.sections.payments.title}
        description={t.sections.payments.description}
        onSave={handleSavePayments}
        isSaving={isSaving}
        saveLabel={t.save}
        savingLabel={t.saving}
        successMessage={t.saveSuccess}
        errorMessage={t.saveError}
      >
        {/* Payment Types */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/90">{t.fields.paymentTypes}</label>
          <div className="flex flex-wrap gap-2">
            {paymentTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (paymentTypes.includes(option.value)) {
                    setPaymentTypes(paymentTypes.filter((p) => p !== option.value));
                  } else {
                    setPaymentTypes([...paymentTypes, option.value]);
                  }
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  paymentTypes.includes(option.value)
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stripe Connect Status */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">{t.fields.stripeAccount}</h4>
              {initialData.stripeAccountId ? (
                <p className="mt-1 flex items-center gap-2 text-sm text-green-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t.fields.stripeConnected}
                </p>
              ) : (
                <p className="mt-1 text-sm text-amber-400">
                  {t.fields.stripeNotConnected}
                </p>
              )}
            </div>
            {!initialData.stripeAccountId && (
              <a
                href="/api/stripe/connect"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
                  "bg-gradient-to-r from-[#635bff] to-[#00d4ff] text-white",
                  "transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                )}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.479 9.883c-1.626-.604-2.512-1.067-2.512-1.803 0-.612.511-1.012 1.396-1.012 1.374 0 2.853.547 3.927 1.147l.557-2.67c-.904-.472-2.251-.996-4.238-.996-1.626 0-2.979.441-3.927 1.232-.996.852-1.507 2.003-1.507 3.383 0 2.119 1.459 3.043 3.737 3.876 1.531.557 2.003.996 2.003 1.627 0 .693-.557 1.147-1.579 1.147-1.327 0-3.107-.612-4.354-1.376l-.557 2.731c1.114.671 2.842 1.232 4.733 1.232 1.686 0 3.092-.404 4.027-1.171 1.019-.833 1.555-2.058 1.555-3.605 0-2.127-1.531-3.073-3.261-3.742z" />
                </svg>
                {t.fields.stripeOnboarding}
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* Section 7: Location */}
      <Section
        title={t.sections.location.title}
        description={t.sections.location.description}
        onSave={handleSaveLocation}
        isSaving={isSaving}
        saveLabel={t.save}
        savingLabel={t.saving}
        successMessage={t.saveSuccess}
        errorMessage={t.saveError}
      >
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onLocationChange={handleLocationChange}
          labels={{
            latitude: t.fields.latitude,
            longitude: t.fields.longitude,
          }}
        />
      </Section>
    </div>
  );
}
