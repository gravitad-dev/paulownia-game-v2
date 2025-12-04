/**
 * Tipos para la sesión del juego (start/end)
 * Basado en: GAME-SESSION-ENDPOINTS.md
 */

import { LevelDifficulty } from "./level";

/**
 * Dificultades del backend (nombres en español)
 * Mapeo: easy → aprendiz, easy2 → novato, etc.
 */
export type BackendDifficulty =
  | "aprendiz"
  | "novato"
  | "aventurero"
  | "veterano"
  | "maestro"
  | "leyenda";

/**
 * Mapeo de dificultades frontend → backend
 */
export const DIFFICULTY_MAP: Record<LevelDifficulty, BackendDifficulty> = {
  easy: "aprendiz",
  easy2: "novato",
  medium: "aventurero",
  medium2: "veterano",
  hard: "maestro",
  hard2: "leyenda",
};

/**
 * Grid sizes posibles según la dificultad
 */
export type GridSize = "6x6x6" | "8x8x8";

// ============================================
// START GAME
// ============================================

/**
 * Request para iniciar partida
 * POST /api/game/start
 */
export interface StartGameRequest {
  /** UUID del nivel a jugar */
  levelUuid: string;
  /** Dificultad seleccionada (nombre backend) */
  difficulty: BackendDifficulty;
  /** Timestamp de inicio (ISO string) */
  startAt: string;
  /** Seed para generar el tablero */
  seed: string;
}

/**
 * Response exitosa de iniciar partida
 */
export interface StartGameResponse {
  data: {
    /** Hash único de la sesión (necesario para finalizar) */
    hash: string;
    /** Tamaño del grid según dificultad */
    gridSize: GridSize;
    /** Timestamp confirmado de inicio */
    startedAt: string;
    /** ID del registro de historial de juego */
    gameHistoryId: number;
  };
}

/**
 * Errores posibles al iniciar partida
 */
export interface StartGameError {
  reason:
    | "unauthorized"
    | "missing_required_fields"
    | "level_not_found"
    | "level_not_unlocked"
    | "level_locked";
  required?: string[];
}

// ============================================
// END GAME
// ============================================

/**
 * Status del resultado del juego
 */
export type GameResultStatus = "won" | "lost" | "abandoned";

/**
 * Request para finalizar partida
 * POST /api/game/end
 */
export interface EndGameRequest {
  /** UUID del nivel jugado */
  levelUuid: string;
  /** Dificultad jugada (nombre backend) */
  difficulty: BackendDifficulty;
  /** Timestamp de finalización (ISO string) */
  endAt: string;
  /** Hash de la sesión (obtenido de start) */
  hash: string;
  /** Estado del resultado: won, lost, abandoned */
  status: GameResultStatus;
  /** Puntos extra opcionales */
  bonusPoints?: number;
}

/**
 * Response exitosa de finalizar partida
 */
export interface EndGameResponse {
  data: {
    /** Status final */
    status: GameResultStatus;
    /** Puntuación calculada por el backend */
    score: number;
    /** Duración en segundos */
    duration: number;
    /** Timestamp de finalización */
    completedAt: string;
    /** Estado actualizado del nivel para el usuario */
    levelStatus: "won" | "available";
    /** Si ya estaba completado previamente (idempotencia) */
    alreadyCompleted?: boolean;
  };
}

/**
 * Errores posibles al finalizar partida
 */
export interface EndGameError {
  reason:
    | "unauthorized"
    | "missing_required_fields"
    | "level_not_found"
    | "history_not_found";
  required?: string[];
}

// ============================================
// SESSION STATE
// ============================================

/**
 * Estado de la sesión activa del juego
 */
export interface GameSession {
  /** UUID del nivel */
  levelUuid: string;
  /** Dificultad frontend */
  difficulty: LevelDifficulty;
  /** Hash de la sesión (de start response) */
  hash: string;
  /** Seed usada para generar el tablero */
  seed: string;
  /** Grid size recibido del backend */
  gridSize: GridSize;
  /** Timestamp de inicio */
  startedAt: string;
  /** ID del historial de juego */
  gameHistoryId: number;
}

/**
 * Genera una seed aleatoria para el juego
 * Formato: cadena alfanumérica de 16 caracteres
 */
export function generateGameSeed(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let seed = "";
  for (let i = 0; i < 16; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return seed;
}

/**
 * Valida que una seed sea apta para generar un nivel
 * Una seed válida es una cadena alfanumérica de al menos 8 caracteres
 */
export function isValidSeed(seed: string): boolean {
  if (!seed || typeof seed !== "string") return false;
  if (seed.length < 8) return false;
  // Solo caracteres alfanuméricos
  return /^[A-Za-z0-9]+$/.test(seed);
}

