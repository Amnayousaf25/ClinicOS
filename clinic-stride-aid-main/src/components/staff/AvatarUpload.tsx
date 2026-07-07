import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AvatarDraft } from './types';

interface Props {
  value: AvatarDraft | null;
  initial: string;
  colorClass: string;
  onChange: (next: AvatarDraft) => void;
}

const MAX_BYTES = 5 * 1024 * 1024;

export const AvatarUpload = ({ value, initial, colorClass, onChange }: Props) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be under 5 MB');
      return;
    }
    onChange({ file, previewUrl: URL.createObjectURL(file) });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative group focus:outline-none"
        aria-label="Upload profile photo"
      >
        {value ? (
          <img
            src={value.previewUrl}
            alt="Profile preview"
            className="w-20 h-20 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div
            className={cn(
              'w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold',
              colorClass,
            )}
          >
            {initial || '?'}
          </div>
        )}
        <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </span>
      </button>
      <p className="text-xs text-muted-foreground">Click to upload photo</p>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};
