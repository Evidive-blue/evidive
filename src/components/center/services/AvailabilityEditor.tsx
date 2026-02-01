"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

const AVAILABLE_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

interface AvailabilityEditorProps {
  availableDays: string[];
  startTimes: string[];
  onDaysChange: (days: string[]) => void;
  onTimesChange: (times: string[]) => void;
  locale: string;
  disabled?: boolean;
}

export function AvailabilityEditor({
  availableDays,
  startTimes,
  onDaysChange,
  onTimesChange,
  disabled,
}: AvailabilityEditorProps) {
  const t = useTranslations("centerServices");
  const [timeInput, setTimeInput] = useState("");

  const toggleDay = (day: string) => {
    if (disabled) return;
    if (availableDays.includes(day)) {
      onDaysChange(availableDays.filter((d) => d !== day));
    } else {
      onDaysChange([...availableDays, day]);
    }
  };

  const handleAddTime = () => {
    if (!timeInput || startTimes.includes(timeInput) || disabled) return;
    const newTimes = [...startTimes, timeInput].sort();
    onTimesChange(newTimes);
    setTimeInput("");
  };

  const handleRemoveTime = (time: string) => {
    if (disabled) return;
    onTimesChange(startTimes.filter((t) => t !== time));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTime();
    }
  };

  // Quick add preset times
  const presetTimes = ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"];
  const availablePresets = presetTimes.filter((t) => !startTimes.includes(t));

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="h-5 w-5 text-purple-400" />
          {t("form.schedule")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Days */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/80">
            {t("form.availableDays")}
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                disabled={disabled}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  availableDays.includes(day)
                    ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/50"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {t(`days.${day}`)}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/40">
            {availableDays.length === 7
              ? "Disponible tous les jours"
              : availableDays.length === 0
                ? "Aucun jour sélectionné"
                : `${availableDays.length} jour(s) sélectionné(s)`}
          </p>
        </div>

        {/* Start Times */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/80">
            {t("form.startTimes")}
          </label>
          
          {/* Add Time Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className="border-white/10 bg-white/5 pl-10 text-white"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddTime}
              disabled={!timeInput || startTimes.includes(timeInput) || disabled}
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10"
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("form.addTime")}
            </Button>
          </div>

          {/* Quick Add Presets */}
          {availablePresets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/40">Ajout rapide :</span>
              {availablePresets.slice(0, 4).map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    if (!disabled) {
                      onTimesChange([...startTimes, time].sort());
                    }
                  }}
                  disabled={disabled}
                  className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  + {time}
                </button>
              ))}
            </div>
          )}

          {/* Selected Times */}
          {startTimes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {startTimes.map((time) => (
                <Badge
                  key={time}
                  variant="secondary"
                  className="bg-purple-500/20 text-purple-200"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  {time}
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(time)}
                    disabled={disabled}
                    className="ml-1.5 rounded-full p-0.5 hover:bg-white/20 hover:text-red-300 disabled:cursor-not-allowed"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-white/20 p-4 text-center text-sm text-white/40">
              Aucun horaire défini. Ajoutez au moins un horaire de départ.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
