import { LevelDifficulty } from "@/types/level";

// Re-exportar configuración de dificultad para acceso centralizado
export {
  DIFFICULTY_CONFIGS,
  getDifficultyConfig,
  getDifficultyLabel,
  calculateScore,
  formatTime,
  getNormalPiecesCount,
  getPuzzlePiecesCount,
  type DifficultyConfig,
  type GameScore,
} from "../difficultyConfig";

export type GameDifficulty = "easy" | "medium" | "hard";

export type CellState = "empty" | "filled" | "ghost" | "boundary";

export type Grid3D = CellState[][][];

const DIFFICULTY_TO_SIZE: Record<GameDifficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 8, // Reducido de 10 a 8 para hacer Maestro y Leyenda más accesibles
};

export function getGridSizeByDifficulty(difficulty: GameDifficulty): number {
  return DIFFICULTY_TO_SIZE[difficulty];
}

/**
 * Obtiene el tamaño del grid basado en LevelDifficulty.
 * Mapea las 6 dificultades de nivel a 3 tamaños de grid.
 */
export function getGridSizeByLevelDifficulty(difficulty: LevelDifficulty): number {
  const gameDifficulty = mapLevelDifficultyToGameDifficulty(difficulty);
  return DIFFICULTY_TO_SIZE[gameDifficulty];
}

export function getCellWorldPosition(
  x: number,
  y: number,
  z: number,
  size: number,
): [number, number, number] {
  const offset = (size - 1) / 2;
  return [x - offset, y - offset, z - offset];
}

export function createEmptyGrid(size: number): Grid3D {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      Array.from<CellState>({ length: size }).fill("empty"),
    ),
  );
}

export function mapLevelDifficultyToGameDifficulty(
  difficulty?: LevelDifficulty,
): GameDifficulty {
  switch (difficulty) {
    case "easy":
    case "easy2":
      return "easy";
    case "medium":
    case "medium2":
      return "medium";
    case "hard":
    case "hard2":
    default:
      return "hard";
  }
}



