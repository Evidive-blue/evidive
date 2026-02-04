'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  User,
  Mail,
  Phone,
  Award,
  Languages,
  Star,
  X,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocale } from '@/lib/i18n/locale-provider';
import { toast } from 'sonner';

interface Worker {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  bio: string | null;
  certifications: string[];
  languages: string[];
  isDefault: boolean;
  isActive: boolean;
}

interface Center {
  id: string;
  slug: string;
  name: unknown;
  workers: Worker[];
}

interface TeamManageClientProps {
  center: Center;
}

const CERTIFICATIONS = ['PADI', 'SSI', 'CMAS', 'NAUI', 'BSAC', 'SDI/TDI', 'FFESSM', 'RAID'];
const LANGUAGES = ['English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian'];

type WorkerFormData = {
  name: string;
  email: string;
  phone: string;
  bio: string;
  certifications: string[];
  languages: string[];
  isDefault: boolean;
  isActive: boolean;
};

const defaultWorkerForm: WorkerFormData = {
  name: '',
  email: '',
  phone: '',
  bio: '',
  certifications: [],
  languages: [],
  isDefault: false,
  isActive: true,
};

export function TeamManageClient({ center }: TeamManageClientProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [workers, setWorkers] = useState<Worker[]>(center.workers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<WorkerFormData>(defaultWorkerForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getLocalized = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, string>;
      return obj[locale] || obj.en || obj.fr || Object.values(obj)[0] || '';
    }
    return '';
  };

  const openAddModal = () => {
    setEditingWorker(null);
    setFormData(defaultWorkerForm);
    setIsModalOpen(true);
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      email: worker.email || '',
      phone: worker.phone || '',
      bio: worker.bio || '',
      certifications: worker.certifications,
      languages: worker.languages,
      isDefault: worker.isDefault,
      isActive: worker.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWorker(null);
    setFormData(defaultWorkerForm);
  };

  const toggleCertification = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingWorker
        ? `/api/centers/${center.slug}/workers/${editingWorker.id}`
        : `/api/centers/${center.slug}/workers`;

      const response = await fetch(url, {
        method: editingWorker ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save worker');
      }

      const result = await response.json();

      if (editingWorker) {
        setWorkers((prev) =>
          prev.map((w) => (w.id === editingWorker.id ? result.worker : w))
        );
        toast.success('Membre mis à jour');
      } else {
        setWorkers((prev) => [...prev, result.worker]);
        toast.success('Membre ajouté');
      }

      closeModal();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (workerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;

    setDeletingId(workerId);
    try {
      const response = await fetch(`/api/centers/${center.slug}/workers/${workerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete worker');
      }

      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      toast.success('Membre supprimé');
      router.refresh();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="h-8 w-8 text-cyan-400" />
                Gérer l'équipe
              </h1>
              <p className="mt-1 text-white/60">
                {getLocalized(center.name)} • {workers.length} membre{workers.length !== 1 ? 's' : ''}
              </p>
            </div>

            <Button
              onClick={openAddModal}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Workers List */}
        {workers.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-white/20 mb-4" />
              <p className="text-white/60 mb-4">Aucun membre dans l'équipe</p>
              <Button
                onClick={openAddModal}
                className="rounded-xl bg-cyan-500 hover:bg-cyan-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter le premier membre
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {workers.map((worker) => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`bg-white/5 border-white/10 ${!worker.isActive ? 'opacity-50' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                        {worker.photoUrl ? (
                          <img
                            src={worker.photoUrl}
                            alt={worker.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-7 w-7 text-white" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white truncate">
                            {worker.name}
                          </h3>
                          {worker.isDefault && (
                            <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-400">
                              <Star className="h-3 w-3" />
                              Principal
                            </Badge>
                          )}
                          {!worker.isActive && (
                            <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                              Inactif
                            </Badge>
                          )}
                        </div>

                        {worker.email && (
                          <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {worker.email}
                          </p>
                        )}

                        {worker.certifications.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {worker.certifications.slice(0, 3).map((cert) => (
                              <Badge key={cert} variant="outline" className="text-xs border-white/20">
                                {cert}
                              </Badge>
                            ))}
                            {worker.certifications.length > 3 && (
                              <Badge variant="outline" className="text-xs border-white/20">
                                +{worker.certifications.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(worker)}
                        className="flex-1 rounded-xl border-white/10 bg-white/5"
                      >
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(worker.id)}
                        disabled={deletingId === worker.id}
                        className="rounded-xl border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        {deletingId === worker.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={(e) => e.target === e.currentTarget && closeModal()}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    {editingWorker ? 'Modifier le membre' : 'Ajouter un membre'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <Label className="text-white">Nom *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Jean Dupont"
                      className="mt-2 bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                        placeholder="jean@exemple.com"
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+33 6 12 34 56 78"
                        className="mt-2 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label className="text-white">Bio</Label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                      rows={3}
                      placeholder="Décrivez l'expérience et les spécialités..."
                      className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Certifications */}
                  <div>
                    <Label className="text-white flex items-center gap-2">
                      <Award className="h-4 w-4 text-cyan-400" />
                      Certifications
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {CERTIFICATIONS.map((cert) => (
                        <button
                          key={cert}
                          type="button"
                          onClick={() => toggleCertification(cert)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            formData.certifications.includes(cert)
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {cert}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <Label className="text-white flex items-center gap-2">
                      <Languages className="h-4 w-4 text-cyan-400" />
                      Langues parlées
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            formData.languages.includes(lang)
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={formData.isDefault}
                        onCheckedChange={(checked) =>
                          setFormData((p) => ({ ...p, isDefault: !!checked }))
                        }
                      />
                      <span className="text-white">Membre principal (affiché en priorité)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData((p) => ({ ...p, isActive: !!checked }))
                        }
                      />
                      <span className="text-white">Membre actif (visible publiquement)</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeModal}
                      className="flex-1 rounded-xl border-white/10 bg-white/5"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-600"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {editingWorker ? 'Mettre à jour' : 'Ajouter'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
