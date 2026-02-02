"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultilingualInput,
  MultilingualTextarea,
  type MultilingualValue,
} from "@/components/ui/multilingual-input";
import { MultipleImageUploader } from "@/components/ui/image-uploader";
import { ExtrasEditor } from "./ExtrasEditor";
import { AvailabilityEditor } from "./AvailabilityEditor";
import {
  Save,
  Loader2,
  Plus,
  X,
  Users,
  Euro,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import type { ServiceExtraData } from "@/lib/validations/service";

type LocalizedJson = {
  fr?: string;
  en?: string;
  es?: string;
  it?: string;
  de?: string;
};

interface Category {
  id: string;
  slug: string;
  name: LocalizedJson;
}

interface ServiceData {
  id?: string;
  name: LocalizedJson;
  description?: LocalizedJson;
  categoryId?: string | null;
  price: number;
  currency: string;
  pricePerPerson: boolean;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  minCertification?: string | null;
  minAge: number;
  maxDepth?: number | null;
  equipmentIncluded: boolean;
  equipmentDetails?: string | null;
  includes: string[];
  photos: string[];
  availableDays: string[];
  startTimes: string[];
  extras?: ServiceExtraData[];
}

interface ServiceFormProps {
  service?: ServiceData;
  categories: Category[];
  locale: string;
  translations: {
    title: string;
    basicInfo: string;
    pricing: string;
    capacity: string;
    schedule: string;
    media: string;
    extras: string;
    name: string;
    nameFr: string;
    nameEn: string;
    namePlaceholder: string;
    description: string;
    descriptionFr: string;
    descriptionEn: string;
    descriptionPlaceholder: string;
    category: string;
    selectCategory: string;
    price: string;
    currency: string;
    pricePerPerson: string;
    duration: string;
    minParticipants: string;
    maxParticipants: string;
    minCertification: string;
    noCertification: string;
    minAge: string;
    maxDepth: string;
    equipmentIncluded: string;
    equipmentDetails: string;
    equipmentDetailsPlaceholder: string;
    includes: string;
    includesPlaceholder: string;
    availableDays: string;
    startTimes: string;
    addTime: string;
    photos: string;
    addPhoto: string;
    submit: string;
    creating: string;
    updating: string;
    success: string;
    error: string;
  };
  daysTranslations: Record<string, string>;
  certificationsTranslations: Record<string, string>;
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string; serviceId?: string }>;
}

const AVAILABLE_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const CERTIFICATIONS = ["none", "ow", "aow", "rescue", "dm", "instructor"];

export function ServiceForm({
  service,
  categories,
  locale,
  translations: t,
  daysTranslations,
  certificationsTranslations,
  onSubmit,
}: ServiceFormProps) {
  void daysTranslations; // Reserved for availability scheduling UI
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state - using MultilingualValue type
  const [name, setName] = useState<MultilingualValue>({
    fr: service?.name?.fr || "",
    en: service?.name?.en || "",
    de: service?.name?.de || "",
    es: service?.name?.es || "",
    it: service?.name?.it || "",
  });
  const [description, setDescription] = useState<MultilingualValue>({
    fr: service?.description?.fr || "",
    en: service?.description?.en || "",
    de: service?.description?.de || "",
    es: service?.description?.es || "",
    it: service?.description?.it || "",
  });
  const [categoryId, setCategoryId] = useState(service?.categoryId || "");
  const [price, setPrice] = useState(service?.price?.toString() || "");
  const [currency, setCurrency] = useState(service?.currency || "EUR");
  const [pricePerPerson, setPricePerPerson] = useState(service?.pricePerPerson ?? true);
  const [durationMinutes, setDurationMinutes] = useState(
    service?.durationMinutes?.toString() || ""
  );
  const [minParticipants, setMinParticipants] = useState(
    service?.minParticipants?.toString() || "1"
  );
  const [maxParticipants, setMaxParticipants] = useState(
    service?.maxParticipants?.toString() || "10"
  );
  const [minCertification, setMinCertification] = useState(
    service?.minCertification || "none"
  );
  const [minAge, setMinAge] = useState(service?.minAge?.toString() || "10");
  const [maxDepth, setMaxDepth] = useState(service?.maxDepth?.toString() || "");
  const [equipmentIncluded, setEquipmentIncluded] = useState(
    service?.equipmentIncluded ?? false
  );
  const [equipmentDetails, setEquipmentDetails] = useState(
    service?.equipmentDetails || ""
  );
  const [includes, setIncludes] = useState<string[]>(service?.includes || []);
  const [includeInput, setIncludeInput] = useState("");
  const [photos, setPhotos] = useState<string[]>(service?.photos || []);
  const [availableDays, setAvailableDays] = useState<string[]>(
    service?.availableDays || [...AVAILABLE_DAYS]
  );
  const [startTimes, setStartTimes] = useState<string[]>(service?.startTimes || []);
  const [extras, setExtras] = useState<ServiceExtraData[]>(
    (service?.extras || []).map((e, i) => ({ ...e, id: e.id || `temp-${i}` }))
  );

  const handleAddInclude = () => {
    if (includeInput.trim() && !includes.includes(includeInput.trim())) {
      setIncludes([...includes, includeInput.trim()]);
      setIncludeInput("");
    }
  };

  const handleRemoveInclude = (item: string) => {
    setIncludes(includes.filter((i) => i !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const formData = new FormData();

      if (service?.id) {
        formData.append("id", service.id);
      }

      // Clean up name and description objects
      const cleanName: LocalizedJson = {};
      if (name.fr?.trim()) cleanName.fr = name.fr.trim();
      if (name.en?.trim()) cleanName.en = name.en.trim();
      if (name.de?.trim()) cleanName.de = name.de.trim();
      if (name.es?.trim()) cleanName.es = name.es.trim();
      if (name.it?.trim()) cleanName.it = name.it.trim();

      const cleanDescription: LocalizedJson = {};
      if (description.fr?.trim()) cleanDescription.fr = description.fr.trim();
      if (description.en?.trim()) cleanDescription.en = description.en.trim();
      if (description.de?.trim()) cleanDescription.de = description.de.trim();
      if (description.es?.trim()) cleanDescription.es = description.es.trim();
      if (description.it?.trim()) cleanDescription.it = description.it.trim();

      formData.append("name", JSON.stringify(cleanName));
      formData.append("description", JSON.stringify(cleanDescription));
      formData.append("categoryId", categoryId || "");
      formData.append("price", price);
      formData.append("currency", currency);
      formData.append("pricePerPerson", pricePerPerson.toString());
      formData.append("durationMinutes", durationMinutes);
      formData.append("minParticipants", minParticipants);
      formData.append("maxParticipants", maxParticipants);
      formData.append("minCertification", minCertification === "none" ? "" : minCertification);
      formData.append("minAge", minAge);
      formData.append("maxDepth", maxDepth);
      formData.append("equipmentIncluded", equipmentIncluded.toString());
      formData.append("equipmentDetails", equipmentDetails);
      formData.append("includes", JSON.stringify(includes));
      formData.append("photos", JSON.stringify(photos));
      formData.append("availableDays", JSON.stringify(availableDays));
      formData.append("startTimes", JSON.stringify(startTimes));
      formData.append("extras", JSON.stringify(extras));

      const result = await onSubmit(formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/center/services`);
        }, 1500);
      } else {
        setError(result.error || t.error);
      }
    });
  };

  const getLocalizedName = (nameObj: unknown): string => {
    if (!nameObj || typeof nameObj !== "object") return "";
    const obj = nameObj as LocalizedJson;
    return obj[locale as keyof LocalizedJson] || obj.fr || obj.en || "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5 text-cyan-400" />
            {t.basicInfo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name - Multilingual */}
          <MultilingualInput
            value={name}
            onChange={setName}
            label={`${t.name} *`}
            placeholder={{
              fr: t.namePlaceholder,
              en: t.namePlaceholder,
              de: t.namePlaceholder,
              es: t.namePlaceholder,
              it: t.namePlaceholder,
            }}
            required={["fr"]}
          />

          {/* Description - Multilingual */}
          <MultilingualTextarea
            value={description}
            onChange={setDescription}
            label={t.description}
            placeholder={{
              fr: t.descriptionPlaceholder,
              en: t.descriptionPlaceholder,
              de: t.descriptionPlaceholder,
              es: t.descriptionPlaceholder,
              it: t.descriptionPlaceholder,
            }}
            required={[]}
            rows={4}
          />

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white/80">
              {t.category}
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="border-white/10 bg-white/5 text-white">
                <SelectValue placeholder={t.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {getLocalizedName(cat.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Euro className="h-5 w-5 text-emerald-400" />
            {t.pricing}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-white/80">
                {t.price} *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="border-white/10 bg-white/5 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-white/80">
                {t.currency}
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-8">
              <Switch
                id="pricePerPerson"
                checked={pricePerPerson}
                onCheckedChange={setPricePerPerson}
              />
              <Label htmlFor="pricePerPerson" className="text-white/80">
                {t.pricePerPerson}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity & Requirements */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-amber-400" />
            {t.capacity}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-white/80">
                {t.duration} *
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
                placeholder="120"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minPax" className="text-white/80">
                {t.minParticipants}
              </Label>
              <Input
                id="minPax"
                type="number"
                min="1"
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
                className="border-white/10 bg-white/5 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPax" className="text-white/80">
                {t.maxParticipants}
              </Label>
              <Input
                id="maxPax"
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="border-white/10 bg-white/5 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="certification" className="text-white/80">
                {t.minCertification}
              </Label>
              <Select value={minCertification} onValueChange={setMinCertification}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATIONS.map((cert) => (
                    <SelectItem key={cert} value={cert}>
                      {certificationsTranslations[cert] || cert}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minAge" className="text-white/80">
                {t.minAge}
              </Label>
              <Input
                id="minAge"
                type="number"
                min="0"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="border-white/10 bg-white/5 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDepth" className="text-white/80">
                {t.maxDepth}
              </Label>
              <Input
                id="maxDepth"
                type="number"
                min="0"
                value={maxDepth}
                onChange={(e) => setMaxDepth(e.target.value)}
                placeholder="40"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Equipment Included */}
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <Switch
                id="equipmentIncluded"
                checked={equipmentIncluded}
                onCheckedChange={setEquipmentIncluded}
              />
              <Label htmlFor="equipmentIncluded" className="text-white">
                {t.equipmentIncluded}
              </Label>
            </div>
            {equipmentIncluded && (
              <div className="space-y-2">
                <Label htmlFor="equipmentDetails" className="text-white/80">
                  {t.equipmentDetails}
                </Label>
                <Input
                  id="equipmentDetails"
                  value={equipmentDetails}
                  onChange={(e) => setEquipmentDetails(e.target.value)}
                  placeholder={t.equipmentDetailsPlaceholder}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
            )}
          </div>

          {/* Includes */}
          <div className="space-y-2">
            <Label className="text-white/80">{t.includes}</Label>
            <div className="flex gap-2">
              <Input
                value={includeInput}
                onChange={(e) => setIncludeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInclude();
                  }
                }}
                placeholder={t.includesPlaceholder}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
              <Button
                type="button"
                onClick={handleAddInclude}
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {includes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {includes.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="bg-cyan-500/20 text-cyan-200"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveInclude(item)}
                      className="ml-1 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Availability - Using AvailabilityEditor Component */}
      <AvailabilityEditor
        availableDays={availableDays}
        startTimes={startTimes}
        onDaysChange={setAvailableDays}
        onTimesChange={setStartTimes}
        locale={locale}
      />

      {/* Media - Photos Upload */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ImageIcon className="h-5 w-5 text-pink-400" />
            {t.media}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MultipleImageUploader
            value={photos}
            onChange={setPhotos}
            label={t.photos}
            hint="JPG, PNG, WebP (max 5 Mo)"
            maxImages={10}
          />
        </CardContent>
      </Card>

      {/* Extras */}
      <ExtrasEditor
        extras={extras}
        onChange={setExtras}
        locale={locale}
      />

      {/* Error / Success */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-200">{t.success}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-white/10 text-white hover:bg-white/10"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-cyan-600 text-white hover:bg-cyan-700"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {service?.id ? t.updating : t.creating}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t.submit}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
