"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Clock, Percent, Save, Loader2 } from "lucide-react";
import { updateCancellationPolicy } from "@/actions/center-settings";
import type { CancellationPolicy } from "@prisma/client";

interface CancellationPolicyEditorProps {
  centerId: string;
  initialValues: {
    cancellationPolicy: CancellationPolicy;
    cancellationHours: number;
    partialRefundPercent: number;
  };
  translations: {
    title: string;
    policyLabel: string;
    flexible: string;
    flexibleDesc: string;
    moderate: string;
    moderateDesc: string;
    strict: string;
    strictDesc: string;
    hoursLabel: string;
    hoursDesc: string;
    refundLabel: string;
    refundDesc: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
    invalidHours: string;
    invalidRefund: string;
  };
}

export function CancellationPolicyEditor({
  centerId,
  initialValues,
  translations: t,
}: CancellationPolicyEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [policy, setPolicy] = useState<CancellationPolicy>(
    initialValues.cancellationPolicy
  );
  const [hours, setHours] = useState(initialValues.cancellationHours.toString());
  const [refund, setRefund] = useState(
    initialValues.partialRefundPercent.toString()
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handlePolicyChange = (value: CancellationPolicy) => {
    setPolicy(value);
    setHasChanges(true);

    // Set default values based on policy type
    switch (value) {
      case "FLEXIBLE":
        setHours("24");
        setRefund("100");
        break;
      case "MODERATE":
        setHours("48");
        setRefund("50");
        break;
      case "STRICT":
        setHours("72");
        setRefund("0");
        break;
    }
  };

  const handleHoursChange = (value: string) => {
    setHours(value);
    setHasChanges(true);
  };

  const handleRefundChange = (value: string) => {
    setRefund(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    const hoursNum = parseInt(hours, 10);
    const refundNum = parseInt(refund, 10);

    // Validate
    if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 168) {
      toast.error(t.invalidHours);
      return;
    }

    if (isNaN(refundNum) || refundNum < 0 || refundNum > 100) {
      toast.error(t.invalidRefund);
      return;
    }

    startTransition(async () => {
      const result = await updateCancellationPolicy(centerId, {
        cancellationPolicy: policy,
        cancellationHours: hoursNum,
        partialRefundPercent: refundNum,
      });

      if (result.ok) {
        toast.success(t.saved);
        setHasChanges(false);
      } else {
        toast.error(t.error);
      }
    });
  };

  const getPolicyDescription = (p: CancellationPolicy) => {
    switch (p) {
      case "FLEXIBLE":
        return t.flexibleDesc;
      case "MODERATE":
        return t.moderateDesc;
      case "STRICT":
        return t.strictDesc;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">{t.title}</h2>
      </div>

      <div className="space-y-4">
        {/* Policy Type */}
        <div className="space-y-2">
          <Label className="text-white">{t.policyLabel}</Label>
          <Select value={policy} onValueChange={handlePolicyChange}>
            <SelectTrigger className="border-white/20 bg-white/5 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FLEXIBLE">{t.flexible}</SelectItem>
              <SelectItem value="MODERATE">{t.moderate}</SelectItem>
              <SelectItem value="STRICT">{t.strict}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-white/60">{getPolicyDescription(policy)}</p>
        </div>

        {/* Hours before dive */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-white">
            <Clock className="h-4 w-4 text-cyan-400" />
            {t.hoursLabel}
          </Label>
          <Input
            type="number"
            min={0}
            max={168}
            value={hours}
            onChange={(e) => handleHoursChange(e.target.value)}
            className="border-white/20 bg-white/5 text-white"
          />
          <p className="text-sm text-white/60">{t.hoursDesc}</p>
        </div>

        {/* Partial refund percent */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-white">
            <Percent className="h-4 w-4 text-cyan-400" />
            {t.refundLabel}
          </Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={refund}
            onChange={(e) => handleRefundChange(e.target.value)}
            className="border-white/20 bg-white/5 text-white"
          />
          <p className="text-sm text-white/60">{t.refundDesc}</p>
        </div>

        {/* Save button */}
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="mt-4 bg-cyan-500 hover:bg-cyan-600"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t.save}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
