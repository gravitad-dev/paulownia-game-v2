export type GameDifficulty = "easy" | "medium" | "hard";

export type CellState = "empty" | "filled" | "ghost" | "boundary";

export type Grid3D = CellState[][][];

const DIFFICULTY_TO_SIZE: Record<GameDifficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 10,
};

export function getGridSizeByDifficulty(difficulty: GameDifficulty): number {
  return DIFFICULTY_TO_SIZE[difficulty];
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
  difficulty?: import("../../../types/level").LevelDifficulty,
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



