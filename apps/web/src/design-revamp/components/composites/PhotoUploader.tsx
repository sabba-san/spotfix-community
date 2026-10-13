import { useState, useRef } from 'react';
import { Camera, ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/design-revamp/components/ui/button';
import { cn } from '@/design-revamp/lib/utils';

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) resolve(result);
      else reject(new Error('Failed to read file'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function PhotoUploader({ photos, onChange, maxPhotos = 5, disabled }: PhotoUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) return;

    const selected = Array.from(files).slice(0, remaining);

    for (const file of selected) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) continue;
    }

    setIsProcessing(true);
    try {
      const dataUrls = await Promise.all(
        selected.slice(0, remaining).map(readFileAsDataUrl),
      );
      onChange([...photos, ...dataUrls]);
    } catch {
      // silently ignore read errors
    } finally {
      setIsProcessing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="group relative">
              <img
                src={photo}
                alt={`Evidence ${index + 1}`}
                className="h-20 w-20 rounded-lg border object-cover"
              />
              <button
                type="button"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removePhoto(index)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 min-h-[48px]"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isProcessing || photos.length >= maxPhotos}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          <span className="ml-2">Camera</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 min-h-[48px]"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled || isProcessing || photos.length >= maxPhotos}
        >
          <ImagePlus className="h-4 w-4" />
          <span className="ml-2">Gallery</span>
        </Button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-xs text-muted-foreground">
        {photos.length}/{maxPhotos} photos · Max 10MB each
      </p>
    </div>
  );
}
