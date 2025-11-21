'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, Loader2 } from 'lucide-react';

import { User, Media } from '@/types/user';
import { Button } from '@/components/ui/button';
import { MediaService, UploadedFile } from '@/services/media.service';
import { UserService } from '@/services/user.service';

interface AvatarUploadProps {
  user: User | null;
  disabled?: boolean;
  onAvatarUpdated?: (updatedUser: User) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const MAX_FILE_SIZE_MB = 2;

export function AvatarUpload({ user, disabled, onAvatarUpdated }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarUrl = useMemo(() => {
    if (preview) return preview;
    if (user?.avatar?.url) {
      return user.avatar.url.startsWith('http')
        ? user.avatar.url
        : `${API_URL}${user.avatar.url}`;
    }
    return null;
  }, [preview, user]);

  const initials = useMemo(() => {
    if (!user?.username) return 'U';
    return user.username
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const validateFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Formato no permitido. Selecciona una imagen.');
    }
    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > MAX_FILE_SIZE_MB) {
      throw new Error(`La imagen supera los ${MAX_FILE_SIZE_MB}MB permitidos.`);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) return;
    const file = event.target.files?.[0];
    if (!file) return;

    let previewUrl: string | null = null;
    try {
      validateFile(file);
      setError(null);
      setIsUploading(true);

      previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      const uploadedFile: UploadedFile = await MediaService.uploadAvatar(file);
      const updatedUser = await UserService.update(String(user.id), {
        avatar: uploadedFile.id as unknown as Media,
      });
      setPreview(null);
      onAvatarUpdated?.(updatedUser);
    } catch (err) {
      console.error('[AvatarUpload] Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Error al subir el avatar.');
      setPreview(null);
    } finally {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSelectFile = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={user?.username || 'Avatar'}
              width={112}
              height={112}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold text-muted-foreground">{initials}</span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleSelectFile}
        disabled={disabled || isUploading || !user}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" />
            Cambiar avatar
          </>
        )}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

