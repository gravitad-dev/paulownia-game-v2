export interface Role {
  id: number;
  name: string;
  description: string;
  type: string;
}

export interface Media {
  id: number;
  url: string;
  width: number;
  height: number;
  // Add other media fields if necessary
}

export interface PlayerStats {
  id: number;
  // Define fields based on PlayerStats model if available, otherwise generic
  [key: string]: unknown;
}

export interface UserDailyReward {
  id: number;
  // Define fields
}

export interface UserAchievement {
  id: number;
  // Define fields
}

export interface UserReward {
  id: number;
  // Define fields
}

export interface UserGameHistory {
  id: number;
  /**
   * Identificador único estable del registro en Strapi.
   * Todas las operaciones GET/PUT/DELETE deben usar este campo en la ruta `/uuid/:uuid`.
   */
  uuid: string;
  /**
   * Relación con el usuario propietario del historial.
   * Normalmente será un ID numérico del usuario de `users-permissions`.
   */
  users_permissions_user?: number;
  /**
   * Relación con el nivel jugado.
   * Se modela de forma mínima para poder mostrar información en la UI.
   */
  level?:
    | {
        id: number;
        name?: string;
      }
    | number
    | null;
  score: number;
  duration: number;
  completedAt: string;
  coinsEarned: number;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserTransactionHistory {
  id: number;
  // Define fields
}

export interface RouletteHistory {
  id: number;
  // Define fields
}

/**
 * Guardian como entidad de Strapi (colección independiente relacionada con User).
 * Ahora incluye campos completos de Strapi para una relación oneToMany.
 */
export interface Guardian {
  id: number;
  documentId: string;
  name: string;
  lastName: string;
  DNI: string;
  email?: string;
  phone?: string;
  address?: string;
  zipcode?: string;
  city?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * Input para crear un nuevo Guardian.
 * No incluye campos gestionados por Strapi (id, documentId, timestamps).
 */
export interface CreateGuardianInput {
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

/**
 * Input para actualizar un Guardian existente.
 * Todos los campos son opcionales excepto los que se requieran actualizar.
 */
export type UpdateGuardianInput = Partial<CreateGuardianInput>;

export interface User {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  role?: Role;
  avatar?: Media;
  isPremium?: boolean;
  name?: string;
  lastname?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  player_stat?: PlayerStats;
  age?: string; // Date as string
  guardiands?: Guardian[]; // Relación oneToMany con Guardiands (nota: plural en API es "guardiands")
  user_daily_rewards?: UserDailyReward[];
  user_achievements?: UserAchievement[];
  user_rewards?: UserReward[];
  user_game_histories?: UserGameHistory[];
  user_transaction_histories?: UserTransactionHistory[];
  roulette_histories?: RouletteHistory[];
  // Strapi v5 document identifier (no usar para componentes normales, solo para documentos)
  documentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  jwt: string;
  user: User;
}
