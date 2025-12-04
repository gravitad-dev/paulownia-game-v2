import { Level } from "./level";

export type LevelStatus = "blocked" | "disabled" | "available" | "won";

export interface UserLevel {
  id: number;
  documentId?: string;
  uuid: string;
  levelStatus: LevelStatus;
  level?: Level | number | null;
  lastPlayed?: string | null;
  users_permissions_user?: number | { id: number } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserLevelResponse {
  data: UserLevel;
}

export interface UserLevelsResponse {
  data: UserLevel[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface UnlockLevelResponse {
  message: string;
  userLevel: UserLevel;
}

