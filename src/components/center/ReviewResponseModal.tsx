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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, Send, AlertCircle } from "lucide-react";
import { respondToReview } from "@/actions/center-reviews";
import { useRouter } from "next/navigation";

interface ReviewResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string | null;
  translations: {
    title: string;
    description: string;
    responseLabel: string;
    responsePlaceholder: string;
    cancel: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    minLength: string;
    maxLength: string;
    alreadyResponded: string;
  };
}

export function ReviewResponseModal({
  isOpen,
  onClose,
  reviewId,
  translations: t,
}: ReviewResponseModalProps) {
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const charCount = response.length;
  const isValidLength = charCount >= 10 && charCount <= 1000;

  const handleSubmit = () => {
    if (!reviewId || !isValidLength) return;

    setError(null);

    startTransition(async () => {
      const result = await respondToReview({
        reviewId,
        response: response.trim(),
      });

      if (result.success) {
        setResponse("");
        onClose();
        router.refresh();
      } else {
        setError(result.error || t.error);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setResponse("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="response" className="text-white/80">
              {t.responseLabel}
            </Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={t.responsePlaceholder}
              className="min-h-[150px] resize-none border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              disabled={isPending}
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={
                  charCount < 10
                    ? "text-amber-400"
                    : charCount > 1000
                      ? "text-red-400"
                      : "text-white/50"
                }
              >
                {charCount < 10
                  ? t.minLength
                  : charCount > 1000
                    ? t.maxLength
                    : `${charCount}/1000`}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !isValidLength}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.submitting}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t.submit}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
