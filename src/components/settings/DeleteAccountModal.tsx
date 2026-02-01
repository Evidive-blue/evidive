"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/actions/settings";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  locale,
}: DeleteAccountModalProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result.ok) {
        // Sign out and redirect to login
        await signOut({ redirect: false });
        router.push(`/${locale}/login`);
      } else {
        setError(result.error || "unknown_error");
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">
              {t("deleteModal.title")}
            </h3>
            <p className="mb-6 text-sm text-white/70">
              {t("deleteModal.description")}
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-sm text-red-400">
                  {t(`errors.${error}`, { defaultMessage: error })}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                onClick={onClose}
                disabled={isPending}
              >
                {t("deleteModal.cancel")}
              </Button>
              <Button
                className="flex-1 bg-red-500 text-white hover:bg-red-600"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("deleteModal.confirm")
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
