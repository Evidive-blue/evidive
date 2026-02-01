"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Loader2 } from "lucide-react";
import type { Worker } from "./WorkerCard";
import type { CreateWorkerInput, UpdateWorkerInput } from "@/actions/workers";

interface WorkerFormTranslations {
  createTitle: string;
  editTitle: string;
  createDescription: string;
  editDescription: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  photo: string;
  photoHint: string;
  bio: string;
  bioPlaceholder: string;
  certifications: string;
  languages: string;
  cancel: string;
  save: string;
  saving: string;
  create: string;
  creating: string;
  optional: string;
  errors: {
    nameRequired: string;
    emailInvalid: string;
    generic: string;
  };
}

interface WorkerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
  translations: WorkerFormTranslations;
  certificationsOptions: { value: string; label: string }[];
  languagesOptions: { value: string; label: string }[];
  onCreate: (input: CreateWorkerInput) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (input: UpdateWorkerInput) => Promise<{ success: boolean; error?: string }>;
}

export function WorkerForm({
  open,
  onOpenChange,
  worker,
  translations: t,
  certificationsOptions,
  languagesOptions,
  onCreate,
  onUpdate,
}: WorkerFormProps) {
  const isEditing = worker !== null;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(worker?.name || "");
  const [email, setEmail] = useState(worker?.email || "");
  const [phone, setPhone] = useState(worker?.phone || "");
  const [photoUrl, setPhotoUrl] = useState(worker?.photoUrl || null);
  const [bio, setBio] = useState(worker?.bio || "");
  const [certifications, setCertifications] = useState<string[]>(
    worker?.certifications || []
  );
  const [languages, setLanguages] = useState<string[]>(
    worker?.languages || []
  );

  // Reset form when dialog opens/closes or worker changes
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setName(worker?.name || "");
      setEmail(worker?.email || "");
      setPhone(worker?.phone || "");
      setPhotoUrl(worker?.photoUrl || null);
      setBio(worker?.bio || "");
      setCertifications(worker?.certifications || []);
      setLanguages(worker?.languages || []);
      setError(null);
    }
    onOpenChange(open);
  };

  const handleCertificationToggle = (value: string) => {
    setCertifications((prev) =>
      prev.includes(value)
        ? prev.filter((c) => c !== value)
        : [...prev, value]
    );
  };

  const handleLanguageToggle = (value: string) => {
    setLanguages((prev) =>
      prev.includes(value) ? prev.filter((l) => l !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError(t.errors.nameRequired);
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.errors.emailInvalid);
      return;
    }

    startTransition(async () => {
      const input = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        photoUrl: photoUrl || undefined,
        bio: bio.trim() || undefined,
        certifications,
        languages,
      };

      let result: { success: boolean; error?: string };

      if (isEditing && worker) {
        result = await onUpdate({ ...input, id: worker.id });
      } else {
        result = await onCreate(input);
      }

      if (result.success) {
        handleOpenChange(false);
      } else {
        setError(result.error || t.errors.generic);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t.editTitle : t.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t.editDescription : t.createDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo */}
          <ImageUploader
            value={photoUrl}
            onChange={setPhotoUrl}
            label={t.photo}
            hint={t.photoHint}
            aspectRatio="square"
            previewClassName="h-32 w-32 mx-auto"
          />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t.name} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              {t.email}{" "}
              <span className="text-white/50">({t.optional})</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              {t.phone}{" "}
              <span className="text-white/50">({t.optional})</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">
              {t.bio}{" "}
              <span className="text-white/50">({t.optional})</span>
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.bioPlaceholder}
              rows={3}
            />
          </div>

          {/* Certifications */}
          <div className="space-y-3">
            <Label>{t.certifications}</Label>
            <div className="grid grid-cols-2 gap-2">
              {certificationsOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`cert-${option.value}`}
                    checked={certifications.includes(option.value)}
                    onCheckedChange={() =>
                      handleCertificationToggle(option.value)
                    }
                  />
                  <label
                    htmlFor={`cert-${option.value}`}
                    className="cursor-pointer text-sm"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <Label>{t.languages}</Label>
            <div className="grid grid-cols-2 gap-2">
              {languagesOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`lang-${option.value}`}
                    checked={languages.includes(option.value)}
                    onCheckedChange={() => handleLanguageToggle(option.value)}
                  />
                  <label
                    htmlFor={`lang-${option.value}`}
                    className="cursor-pointer text-sm"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing
                ? isPending
                  ? t.saving
                  : t.save
                : isPending
                  ? t.creating
                  : t.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
