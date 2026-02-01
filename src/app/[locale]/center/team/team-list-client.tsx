"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkerCard, type Worker } from "@/components/center/WorkerCard";
import { WorkerForm } from "@/components/center/WorkerForm";
import {
  createWorker,
  updateWorker,
  deactivateWorker,
  reactivateWorker,
  deleteWorker,
} from "@/actions/workers";
import type { CreateWorkerInput, UpdateWorkerInput } from "@/actions/workers";
import { Plus, Users } from "lucide-react";

interface TeamListTranslations {
  title: string;
  subtitle: string;
  addMember: string;
  backToCenter: string;
  empty: {
    title: string;
    description: string;
    cta: string;
  };
  card: {
    edit: string;
    deactivate: string;
    reactivate: string;
    delete: string;
    owner: string;
    active: string;
    inactive: string;
    noCertifications: string;
    noLanguages: string;
    confirmDeactivateTitle: string;
    confirmDeactivateDescription: string;
    confirmDeleteTitle: string;
    confirmDeleteDescription: string;
    cannotDeleteWithBookings: string;
    cancel: string;
  };
  form: {
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
  };
  certifications: Record<string, string>;
  languages: Record<string, string>;
}

interface TeamListClientProps {
  workers: Worker[];
  locale: string;
  translations: TeamListTranslations;
}

export function TeamListClient({
  workers,
  locale,
  translations: t,
}: TeamListClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // Certification options for the form
  const certificationsOptions = [
    { value: "ow", label: t.certifications.ow },
    { value: "aow", label: t.certifications.aow },
    { value: "rescue", label: t.certifications.rescue },
    { value: "dm", label: t.certifications.dm },
    { value: "instructor", label: t.certifications.instructor },
    { value: "nitrox", label: t.certifications.nitrox },
    { value: "deep", label: t.certifications.deep },
    { value: "wreck", label: t.certifications.wreck },
    { value: "night", label: t.certifications.night },
    { value: "efr", label: t.certifications.efr },
  ];

  // Language options for the form
  const languagesOptions = [
    { value: "fr", label: t.languages.fr },
    { value: "en", label: t.languages.en },
    { value: "es", label: t.languages.es },
    { value: "it", label: t.languages.it },
    { value: "de", label: t.languages.de },
    { value: "pt", label: t.languages.pt },
    { value: "nl", label: t.languages.nl },
    { value: "ru", label: t.languages.ru },
    { value: "zh", label: t.languages.zh },
    { value: "ja", label: t.languages.ja },
  ];

  const handleOpenCreateForm = () => {
    setEditingWorker(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (worker: Worker) => {
    setEditingWorker(worker);
    setIsFormOpen(true);
  };

  const handleCreate = async (input: CreateWorkerInput) => {
    return createWorker(input);
  };

  const handleUpdate = async (input: UpdateWorkerInput) => {
    return updateWorker(input);
  };

  const handleDeactivate = async (id: string) => {
    return deactivateWorker(id);
  };

  const handleReactivate = async (id: string) => {
    return reactivateWorker(id);
  };

  const handleDelete = async (id: string) => {
    return deleteWorker(id);
  };

  // Empty state
  if (workers.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 py-16 text-center">
          <div className="mb-4 rounded-full bg-cyan-500/10 p-4">
            <Users className="h-10 w-10 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            {t.empty.title}
          </h3>
          <p className="mt-1 max-w-sm text-white/60">
            {t.empty.description}
          </p>
          <Button
            onClick={handleOpenCreateForm}
            className="mt-6 bg-cyan-600 text-white hover:bg-cyan-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t.empty.cta}
          </Button>
        </div>

        <WorkerForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          worker={editingWorker}
          translations={t.form}
          certificationsOptions={certificationsOptions}
          languagesOptions={languagesOptions}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      </>
    );
  }

  return (
    <>
      {/* Add member button */}
      <div className="mb-6 flex justify-end">
        <Button
          onClick={handleOpenCreateForm}
          className="bg-cyan-600 text-white hover:bg-cyan-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t.addMember}
        </Button>
      </div>

      {/* Workers grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {workers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            translations={t.card}
            certificationsMap={t.certifications}
            languagesMap={t.languages}
            onEdit={handleOpenEditForm}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Create/Edit form modal */}
      <WorkerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        worker={editingWorker}
        translations={t.form}
        certificationsOptions={certificationsOptions}
        languagesOptions={languagesOptions}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </>
  );
}
