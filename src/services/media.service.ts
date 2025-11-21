import { api } from '@/lib/api';

export interface UploadedFile {
  id: number;
  url: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats?: Record<string, unknown>;
  hash: string;
  ext: string | null;
  mime: string;
  size: number;
  previewUrl: string | null;
  provider: string;
  provider_metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const UPLOAD_ENDPOINT = '/api/upload';

const buildFormData = (file: File, folder?: string) => {
  const formData = new FormData();
  formData.append('files', file);
  if (folder) {
    formData.append('folder', folder);
  }
  return formData;
};

export const MediaService = {
  async upload(file: File, folder?: string): Promise<UploadedFile> {
    const formData = buildFormData(file, folder);
    const response = await api.post<UploadedFile[]>(
      UPLOAD_ENDPOINT,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    const uploadedFile = response.data[0];
    if (!uploadedFile) {
      throw new Error('No se recibió el archivo subido desde Strapi.');
    }
    return uploadedFile;
  },

  async uploadAvatar(file: File): Promise<UploadedFile> {
    return this.upload(file, 'avatars');
  },

  async delete(fileId: number): Promise<void> {
    await api.delete(`${UPLOAD_ENDPOINT}/files/${fileId}`);
  },
};


