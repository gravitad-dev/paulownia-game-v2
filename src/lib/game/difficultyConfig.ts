import { LevelDifficulty } from "@/types/level";

/**
 * Configuración de dificultad para el juego.
 * Define el comportamiento del gameplay según el nivel de dificultad.
 */
export interface DifficultyConfig {
  /** Nombre para mostrar en la UI */
  label: string;
  /** 
   * Ratio de piezas puzzle a normales.
   * [puzzleCount, normalCount] - Ej: [2, 1] = 2 puzzle, luego 1 normal
   * [puzzleCount, [min, max]] - Ej: [1, [1, 2]] = 1 puzzle, luego 1-2 normales (aleatorio)
   */
  puzzleToNormalRatio: [number, number] | [number, [number, number]];
  /** Cantidad de cargas para la función de limpieza (tecla E) */
  clearCharges: number;
  /** Tiempo límite en segundos */
  timeLimitSeconds: number;
  /** Puntuación base al completar el nivel */
  baseScore: number;
  /** Si se muestra el indicador visual de posición objetivo (verde) */
  showTargetIndicator: boolean;
  /** Color del badge de dificultad (clases Tailwind) */
  badgeColor: string;
}

/**
 * Configuraciones de todas las dificultades del juego.
 */
export const DIFFICULTY_CONFIGS: Record<LevelDifficulty, DifficultyConfig> = {
  easy: {
    label: "Aprendiz",
    puzzleToNormalRatio: [3, 1], // 3 puzzle, 1 normal
    clearCharges: 5,
    timeLimitSeconds: 10 * 60, // 10 minutos
    baseScore: 100,
    showTargetIndicator: true,
    badgeColor: "bg-green-500/10 text-green-600 border-green-500/40",
  },
  easy2: {
    label: "Novato",
    puzzleToNormalRatio: [2, 1], // 2 puzzle, 1 normal
    clearCharges: 4,
    timeLimitSeconds: 8 * 60, // 8 minutos
    baseScore: 200,
    showTargetIndicator: true,
    badgeColor: "bg-green-600/10 text-green-700 border-green-600/40",
  },
  medium: {
    label: "Aventurero",
    puzzleToNormalRatio: [1, 1], // 1 puzzle, 1 normal
    clearCharges: 4, // +1 carga
    timeLimitSeconds: 9 * 60, // 9 minutos (+2 min)
    baseScore: 350,
    showTargetIndicator: true,
    badgeColor: "bg-yellow-500/10 text-yellow-600 border-yellow-500/40",
  },
  medium2: {
    label: "Veterano",
    puzzleToNormalRatio: [1, [1, 2]], // 1 puzzle, 1-2 normales (aleatorio)
    clearCharges: 4, // +1 carga
    timeLimitSeconds: 8 * 60, // 8 minutos (+2 min)
    baseScore: 500,
    showTargetIndicator: true,
    badgeColor: "bg-orange-500/10 text-orange-600 border-orange-500/40",
  },
  hard: {
    label: "Maestro",
    puzzleToNormalRatio: [1, 2], // 1 puzzle, 2 normales
    clearCharges: 4, // +2 cargas
    timeLimitSeconds: 7 * 60, // 7 minutos (+2 min)
    baseScore: 750,
    showTargetIndicator: true,
    badgeColor: "bg-red-500/10 text-red-600 border-red-500/40",
  },
  hard2: {
    label: "Leyenda",
    puzzleToNormalRatio: [1, 3], // 1 puzzle, 3 normales
    clearCharges: 3, // +1 carga
    timeLimitSeconds: 6 * 60, // 6 minutos (+2 min)
    baseScore: 1000,
    showTargetIndicator: false, // Sin ayuda visual
    badgeColor: "bg-red-700/10 text-red-700 border-red-700/40",
  },
};

/**
 * Obtiene la configuración de una dificultad específica.
 */
export function getDifficultyConfig(difficulty: LevelDifficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty];
}

/**
 * Obtiene el label de una dificultad.
 */
export function getDifficultyLabel(difficulty: LevelDifficulty): string {
  return DIFFICULTY_CONFIGS[difficulty].label;
}

/**
 * Estructura del resultado de puntuación.
 */
export interface GameScore {
  /** Puntuación base por dificultad */
  baseScore: number;
  /** Puntuación por líneas eliminadas (50 pts cada una) */
  linesClearedScore: number;
  /** Bonus por tiempo (si termina rápido) */
  timeBonus: number;
  /** Puntuación total */
  totalScore: number;
}

/**
 * Calcula la puntuación final del juego.
 * 
 * @param difficulty - Dificultad del nivel
 * @param linesCleared - Cantidad de líneas eliminadas durante el juego
 * @param timeUsedSeconds - Tiempo usado en segundos
 * @param timeLimitSeconds - Tiempo límite del nivel en segundos
 * @returns Objeto con el desglose de puntuación
 */
export function calculateScore(
  difficulty: LevelDifficulty,
  linesCleared: number,
  timeUsedSeconds: number,
  timeLimitSeconds: number
): GameScore {
  const config = getDifficultyConfig(difficulty);
  const baseScore = config.baseScore;
  const linesClearedScore = linesCleared * 50;

  // Calcular bonus de tiempo
  // Si termina en menos del 50% del tiempo: bonus = baseScore * 0.5
  // Si termina en menos del 75% del tiempo: bonus = baseScore * 0.25
  // Si no: bonus = 0
  let timeBonus = 0;
  const timePercentage = timeUsedSeconds / timeLimitSeconds;
  
  if (timePercentage <= 0.5) {
    timeBonus = Math.floor(baseScore * 0.5);
  } else if (timePercentage <= 0.75) {
    timeBonus = Math.floor(baseScore * 0.25);
  }

  const totalScore = baseScore + linesClearedScore + timeBonus;

  return {
    baseScore,
    linesClearedScore,
    timeBonus,
    totalScore,
  };
}

/**
 * Formatea segundos a formato MM:SS.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Determina cuántas piezas normales deben caer según el ratio de la dificultad.
 * Para ratios con rango aleatorio, devuelve un número aleatorio dentro del rango.
 */
export function getNormalPiecesCount(difficulty: LevelDifficulty): number {
  const config = getDifficultyConfig(difficulty);
  const normalSpec = config.puzzleToNormalRatio[1];
  
  if (Array.isArray(normalSpec)) {
    // Rango aleatorio [min, max]
    const [min, max] = normalSpec;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  return normalSpec;
}

/**
 * Obtiene la cantidad de piezas puzzle por ciclo.
 */
export function getPuzzlePiecesCount(difficulty: LevelDifficulty): number {
  const config = getDifficultyConfig(difficulty);
  return config.puzzleToNormalRatio[0];
}

