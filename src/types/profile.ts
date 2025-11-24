import { User } from './user';

// Tipo para los datos del guardian en el formulario
export interface GuardianFormData {
  id: number; // ID temporal o real para tracking
  documentId: string; // documentId de Strapi (vacío para nuevos)
  name: string;
  lastName: string;
  DNI: string;
  email?: string;
  phone?: string;
  address?: string;
  zipcode?: string;
  city?: string;
  country?: string;
}

// Tipo para el formulario completo incluyendo guardians
export interface ProfileFormData extends Partial<User> {
  guardians?: GuardianFormData[];
}

