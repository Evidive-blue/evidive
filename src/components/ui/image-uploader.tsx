"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  hint?: string;
  accept?: string;
  maxSize?: number; // in MB
  aspectRatio?: "square" | "landscape" | "portrait" | "free";
  previewClassName?: string;
}

export function ImageUploader({
  value,
  onChange,
  disabled,
  className,
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp",
  maxSize = 5,
  aspectRatio = "square",
  previewClassName,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const aspectRatioClasses = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
    free: "",
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file type
    const validTypes = accept.split(",").map((t) => t.trim());
    if (!validTypes.some((type) => file.type.match(type.replace("*", ".*")))) {
      setError("Format de fichier non supporté");
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${maxSize} Mo)`);
      return;
    }

    setIsUploading(true);

    try {
      // Create a data URL for preview (in production, upload to cloud storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError("Erreur lors de la lecture du fichier");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

      // TODO: In production, upload to Supabase Storage or similar
      // const { data, error } = await supabase.storage
      //   .from('center-images')
      //   .upload(`${centerId}/${Date.now()}-${file.name}`, file);
      // if (data) onChange(data.publicUrl);
    } catch {
      setError("Erreur lors de l'upload");
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-white/90">{label}</label>
      )}

      <div
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all",
          aspectRatioClasses[aspectRatio],
          isDragging
            ? "border-cyan-400 bg-cyan-500/10"
            : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10",
          (disabled || isUploading) && "cursor-not-allowed opacity-50",
          value && "border-solid border-cyan-500/30",
          previewClassName
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {value ? (
          <>
            <Image
              src={value}
              alt="Preview"
              fill
              className="rounded-xl object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity hover:opacity-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Changer
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 backdrop-blur-sm transition hover:bg-red-500/30"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            {isUploading ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                <p className="text-sm text-white/60">Upload en cours...</p>
              </>
            ) : (
              <>
                <svg
                  className="h-8 w-8 text-white/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-white/60">
                  Glissez une image ou cliquez pour choisir
                </p>
                {hint && <p className="text-xs text-white/40">{hint}</p>}
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface MultipleImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  hint?: string;
  accept?: string;
  maxSize?: number;
  maxImages?: number;
}

export function MultipleImageUploader({
  value,
  onChange,
  disabled,
  className,
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp",
  maxSize = 5,
  maxImages = 10,
}: MultipleImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileSelect = async (files: FileList) => {
    setError(null);

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images autorisées`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const validTypes = accept.split(",").map((t) => t.trim());

    setIsUploading(true);
    const newUrls: string[] = [];

    for (const file of filesToProcess) {
      // Validate file type
      if (!validTypes.some((type) => file.type.match(type.replace("*", ".*")))) {
        continue;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        continue;
      }

      // Read file as data URL
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }).catch(() => null);

      if (url) newUrls.push(url);
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls]);
    }

    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFileSelect(e.target.files);
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newUrls = [...value];
    const [removed] = newUrls.splice(fromIndex, 1);
    newUrls.splice(toIndex, 0, removed);
    onChange(newUrls);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white/90">{label}</label>
          <span className="text-xs text-white/50">
            {value.length}/{maxImages}
          </span>
        </div>
      )}

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {value.map((url, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", index.toString());
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
                handleReorder(fromIndex, index);
              }}
              className="group relative aspect-square cursor-move overflow-hidden rounded-lg border border-white/10"
            >
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded-lg bg-red-500/20 p-2 text-red-300 transition hover:bg-red-500/30"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-cyan-500/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxImages && (
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all",
            isDragging
              ? "border-cyan-400 bg-cyan-500/10"
              : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10",
            (disabled || isUploading) && "cursor-not-allowed opacity-50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <p className="mt-2 text-sm text-white/60">Upload en cours...</p>
            </>
          ) : (
            <>
              <svg
                className="h-8 w-8 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="mt-2 text-sm text-white/60">
                Ajouter des images ({maxImages - value.length} restantes)
              </p>
              {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
