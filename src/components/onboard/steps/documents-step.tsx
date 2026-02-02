"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Upload, FileText, Shield, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type DocumentType = "license" | "insurance" | "certification";

interface UploadedDoc {
  name: string;
  size: number;
  type: DocumentType;
}

interface CenterDocumentsStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

export function DocumentsStep({ onNext }: CenterDocumentsStepProps) {
  const t = useTranslations("onboard.center.documents");
  const router = useRouter();
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);

  const documentTypes: { type: DocumentType; icon: React.ReactNode; required: boolean }[] = [
    { type: "license", icon: <FileText className="h-6 w-6" />, required: true },
    { type: "insurance", icon: <Shield className="h-6 w-6" />, required: true },
    { type: "certification", icon: <Award className="h-6 w-6" />, required: false },
  ];

  const handleFileChange = (type: DocumentType, files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (file) {
      setDocuments((prev) => [
        ...prev.filter((d) => d.type !== type),
        { name: file.name, size: file.size, type },
      ]);
    }
  };

  const getDocument = (type: DocumentType) => documents.find((d) => d.type === type);

  const handleContinue = () => {
    if (onNext) {
      onNext();
    } else {
      router.push("/onboard/center/payments");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-white/60">{t("description")}</p>

      <div className="grid gap-4 md:grid-cols-3">
        {documentTypes.map(({ type, icon, required }) => {
          const doc = getDocument(type);
          return (
            <div
              key={type}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-cyan-400">
                  {icon}
                </div>
                {required && (
                  <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-400">
                    {t("required")}
                  </span>
                )}
              </div>

              <h3 className="mb-2 font-semibold text-white">{t(`types.${type}`)}</h3>

              {doc ? (
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="truncate text-sm text-white/70">{doc.name}</p>
                  <p className="text-xs text-white/50">
                    {(doc.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-white/20 p-4 transition-colors hover:border-cyan-500/50">
                  <Upload className="mb-2 h-6 w-6 text-white/40" />
                  <span className="text-sm text-white/50">{t("upload")}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileChange(type, e.target.files)}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-white/40">{t("acceptedFormats")}</p>

      <Button
        type="button"
        className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-semibold"
        onClick={handleContinue}
      >
        {t("continue")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
