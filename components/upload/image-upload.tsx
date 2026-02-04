'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  maxFiles?: number;
  label?: string;
}

export function ImageUpload({ value, onChange, maxFiles = 1, label }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const images = Array.isArray(value) ? value : value ? [value] : [];
  const isSingle = maxFiles === 1;

  const onRemove = (url: string) => {
    setIsDeleting(url);
    setTimeout(() => {
      if (isSingle) {
        onChange('');
      } else {
        onChange(images.filter((img) => img !== url));
      }
      setIsDeleting(null);
      toast.success('Image supprimée');
    }, 300);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/uploadthing', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const { url } = await response.json();
        uploadedUrls.push(url);
      }

      if (isSingle) {
        onChange(uploadedUrls[0]);
        toast.success('✅ Image de couverture mise à jour avec succès');
      } else {
        onChange([...images, ...uploadedUrls]);
        toast.success(`✅ ${uploadedUrls.length} image(s) ajoutée(s) à la galerie`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {label && <p className="text-sm font-medium text-white/70">{label}</p>}
      
      {/* Images actuelles */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url) => (
            <div
              key={url}
              className="relative group aspect-video rounded-lg overflow-hidden border border-white/10"
            >
              <Image
                src={url}
                alt="Uploaded image"
                fill
                className="object-cover"
              />
              <Button
                onClick={() => onRemove(url)}
                disabled={isDeleting === url}
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                {isDeleting === url ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'upload */}
      {(!isSingle || images.length === 0) && (
        <div className="flex justify-center">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={!isSingle}
            onChange={handleUpload}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-6 py-3"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                📸 Choisir des images
              </>
            )}
          </Button>
        </div>
      )}
      {!isSingle && (
        <p className="text-xs text-white/50 text-center">
          Max {maxFiles} images • 4MB par image
        </p>
      )}
    </div>
  );
}
