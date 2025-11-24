'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react';

import { User } from '@/types/user';
import { Button } from '@/components/ui/button';

interface AvatarUploadProps {
  user: User | null;
  disabled?: boolean;
  onFileSelected?: (file: File | null) => void;
  previewUrl?: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const MAX_FILE_SIZE_MB = 2;

// Tipos de imagen permitidos
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Magic numbers (firmas de archivo) para validación de seguridad
const MAGIC_NUMBERS: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF - necesita validación adicional
};

/**
 * Lee los primeros bytes de un archivo para validar su magic number
 */
const readFileHeader = async (file: File, bytesToRead: number = 12): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(e.target.result));
      } else {
        reject(new Error('Error al leer el archivo'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file.slice(0, bytesToRead));
  });
};

/**
 * Valida el magic number del archivo contra su MIME type declarado
 */
const validateMagicNumber = async (file: File, mimeType: string): Promise<boolean> => {
  try {
    const header = await readFileHeader(file);
    const magicNumbers = MAGIC_NUMBERS[mimeType];
    
    if (!magicNumbers) {
      return false;
    }

    // Validación especial para WebP (debe contener RIFF y WEBP)
    if (mimeType === 'image/webp') {
      if (header.length < 12) return false;
      const riffBytes = header.slice(0, 4);
      const webpBytes = header.slice(8, 12);
      const riff = String.fromCharCode(...riffBytes) === 'RIFF';
      const webp = String.fromCharCode(...webpBytes) === 'WEBP';
      return riff && webp;
    }

    // Validación para otros formatos
    for (const magic of magicNumbers) {
      let matches = true;
      for (let i = 0; i < magic.length; i++) {
        if (header[i] !== magic[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }

    return false;
  } catch (error) {
    console.error('[AvatarUpload] Error validating magic number:', error);
    return false;
  }
};

/**
 * Sanitiza el nombre del archivo eliminando caracteres peligrosos
 */
const sanitizeFileName = (fileName: string): string => {
  // Remover ruta completa si existe
  const name = fileName.split(/[/\\]/).pop() || fileName;
  // Remover caracteres peligrosos y espacios
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
    .substring(0, 100); // Limitar longitud
};

export function AvatarUpload({ 
  user, 
  disabled, 
  onFileSelected,
  previewUrl: externalPreviewUrl
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalPreview, setInternalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Usar preview externo si existe, sino usar el interno
  const preview = externalPreviewUrl ?? internalPreview;

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

  /**
   * Valida el archivo con múltiples capas de seguridad
   */
  const validateFile = async (file: File): Promise<void> => {
    // 1. Validar que el archivo existe
    if (!file) {
      throw new Error('No se seleccionó ningún archivo.');
    }

    // 2. Validar extensión del archivo
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new Error(
        `Formato no permitido. Solo se permiten: ${ALLOWED_EXTENSIONS.join(', ').replace(/\./g, '')}`
      );
    }

    // 3. Validar MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo se permiten imágenes.');
    }

    // 4. Validar tamaño del archivo
    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > MAX_FILE_SIZE_MB) {
      throw new Error(`La imagen supera los ${MAX_FILE_SIZE_MB}MB permitidos.`);
    }

    // 5. Validar que el archivo no esté vacío
    if (file.size === 0) {
      throw new Error('El archivo está vacío.');
    }

    // 6. Validar magic number (firma del archivo) - crítica para seguridad
    const isValidMagicNumber = await validateMagicNumber(file, file.type);
    if (!isValidMagicNumber) {
      throw new Error('El archivo no es una imagen válida o está corrupto.');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) return;
    const file = event.target.files?.[0];
    if (!file) return;

    let previewUrl: string | null = null;
    try {
      // Validar archivo antes de procesarlo
      await validateFile(file);
      setError(null);

      // Sanitizar nombre del archivo
      const sanitizedName = sanitizeFileName(file.name);
      const sanitizedFile = new File([file], sanitizedName, { type: file.type });

      // Crear preview local
      previewUrl = URL.createObjectURL(sanitizedFile);
      if (!externalPreviewUrl) {
        setInternalPreview(previewUrl);
      }

      // Notificar al componente padre del archivo seleccionado
      onFileSelected?.(sanitizedFile);
    } catch (err) {
      console.error('[AvatarUpload] Error validating file:', err);
      setError(err instanceof Error ? err.message : 'Error al validar el archivo.');
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } finally {
      event.target.value = '';
    }
  };

  const handleSelectFile = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  // Limpiar preview interno cuando se limpia el externo
  useEffect(() => {
    if (!externalPreviewUrl && internalPreview) {
      // Si el preview externo se limpia, también limpiar el interno
      URL.revokeObjectURL(internalPreview);
      setInternalPreview(null);
    }
  }, [externalPreviewUrl, internalPreview]);

  // Limpiar preview al desmontar
  useEffect(() => {
    return () => {
      if (internalPreview) {
        URL.revokeObjectURL(internalPreview);
      }
    };
  }, [internalPreview]);

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
          accept="image/jpeg,image/png,image/webp,image/gif"
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
        disabled={disabled || !user}
      >
        <UploadCloud className="h-4 w-4" />
        Cambiar avatar
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

