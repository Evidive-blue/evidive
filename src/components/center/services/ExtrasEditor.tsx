"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Package, Euro, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ServiceExtraData } from "@/lib/validations/service";

interface ExtrasEditorProps {
  extras: ServiceExtraData[];
  onChange: (extras: ServiceExtraData[]) => void;
  locale: string;
}

export function ExtrasEditor({ extras, onChange, locale }: ExtrasEditorProps) {
  const t = useTranslations("centerServices.extras");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddExtra = () => {
    const newExtra: ServiceExtraData = {
      id: `new-${Date.now()}`,
      name: { fr: "", en: "" },
      description: { fr: "", en: "" },
      price: 0,
      multiplyByPax: false,
      isRequired: false,
      isActive: true,
    };
    onChange([...extras, newExtra]);
    setExpandedIndex(extras.length);
  };

  const handleRemoveExtra = (index: number) => {
    const newExtras = extras.filter((_, i) => i !== index);
    onChange(newExtras);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleUpdateExtra = (index: number, updates: Partial<ServiceExtraData>) => {
    const newExtras = extras.map((extra, i) =>
      i === index ? { ...extra, ...updates } : extra
    );
    onChange(newExtras);
  };

  const getLocalizedName = (extra: ServiceExtraData): string => {
    const name = extra.name;
    return name[locale as keyof typeof name] || name.fr || name.en || "";
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Package className="h-5 w-5 text-orange-400" />
            {t("title")}
          </CardTitle>
          <Button
            type="button"
            onClick={handleAddExtra}
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("add")}
          </Button>
        </div>
        <p className="text-sm text-white/60">{t("subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {extras.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-white/20" />
            <p className="mt-2 text-white/40">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {extras.map((extra, index) => (
              <div
                key={extra.id || index}
                className={cn(
                  "rounded-xl border border-white/10 bg-white/5 transition-all",
                  expandedIndex === index && "ring-1 ring-cyan-500/50"
                )}
              >
                {/* Collapsed Header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedIndex(expandedIndex === index ? null : index)
                  }
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-white/30" />
                    <div>
                      <p className="font-medium text-white">
                        {getLocalizedName(extra) || `Option ${index + 1}`}
                      </p>
                      <p className="text-sm text-white/60">
                        {extra.price > 0
                          ? `${extra.price.toFixed(2)} €`
                          : "Gratuit"}
                        {extra.multiplyByPax && " × participant"}
                        {extra.isRequired && " • Obligatoire"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!extra.isActive && (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-300">
                        Inactif
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveExtra(index);
                      }}
                      className="h-8 w-8 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedIndex === index && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    {/* Name fields */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-white/80">{t("nameFr")} *</Label>
                        <Input
                          value={extra.name.fr || ""}
                          onChange={(e) =>
                            handleUpdateExtra(index, {
                              name: { ...extra.name, fr: e.target.value },
                            })
                          }
                          placeholder={t("namePlaceholder")}
                          className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">{t("nameEn")}</Label>
                        <Input
                          value={extra.name.en || ""}
                          onChange={(e) =>
                            handleUpdateExtra(index, {
                              name: { ...extra.name, en: e.target.value },
                            })
                          }
                          placeholder={t("namePlaceholder")}
                          className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                        />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <Label className="text-white/80">{t("price")}</Label>
                      <div className="relative max-w-[200px]">
                        <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={extra.price}
                          onChange={(e) =>
                            handleUpdateExtra(index, {
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="border-white/10 bg-white/5 pl-10 text-white"
                        />
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`multiplyByPax-${index}`}
                          checked={extra.multiplyByPax}
                          onCheckedChange={(checked) =>
                            handleUpdateExtra(index, { multiplyByPax: checked })
                          }
                        />
                        <Label
                          htmlFor={`multiplyByPax-${index}`}
                          className="text-white/80"
                        >
                          {t("multiplyByPax")}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`isRequired-${index}`}
                          checked={extra.isRequired}
                          onCheckedChange={(checked) =>
                            handleUpdateExtra(index, { isRequired: checked })
                          }
                        />
                        <Label
                          htmlFor={`isRequired-${index}`}
                          className="text-white/80"
                        >
                          {t("isRequired")}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`isActive-${index}`}
                          checked={extra.isActive}
                          onCheckedChange={(checked) =>
                            handleUpdateExtra(index, { isActive: checked })
                          }
                        />
                        <Label
                          htmlFor={`isActive-${index}`}
                          className="text-white/80"
                        >
                          {t("isActive")}
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
