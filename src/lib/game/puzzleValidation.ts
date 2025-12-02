import { PuzzlePiece } from "./puzzleGenerator";
import {
  Tile,
  areTilesConnected,
  isBaseOrientation,
} from "./puzzleTile";

/**
 * Razones por las que una colocación puede fallar
 */
export type PlacementFailureReason =
  | "wrong_y" // No todos los bloques están en Y=0
  | "wrong_position" // Las coordenadas X,Z no coinciden con el patrón
  | "wrong_orientation" // Los tiles no tienen la orientación correcta
  | "tiles_not_connected"; // Los tiles de la pieza no son vecinos

/**
 * Resultado de la validación de colocación de una pieza puzzle
 */
export interface PlacementValidation {
  isValid: boolean;
  reason?: PlacementFailureReason;
}

/**
 * Resultado detallado de validación incluyendo información de tiles
 */
export interface DetailedPlacementValidation extends PlacementValidation {
  /** Tiles que se colocarían con esta pieza */
  tiles?: Tile[];
  /** Si los tiles están conectados entre sí */
  tilesConnected?: boolean;
  /** Si todos los tiles tienen orientación base (⬇️) */
  orientationCorrect?: boolean;
}

/**
 * Valida si una pieza puzzle activa está correctamente colocada.
 *
 * Criterios para una colocación válida:
 * 1. TODOS los bloques deben estar en Y=0 (nivel del suelo)
 * 2. Las coordenadas X,Z de cada bloque deben coincidir exactamente con las celdas del patrón
 * 3. Los tiles de la pieza deben estar conectados (ser vecinos en la imagen)
 * 4. Los tiles deben tener orientación base (no rotados)
 *
 * Nota: Las piezas puzzle NO se pueden rotar en el juego, por lo que
 * la orientación siempre será correcta si la posición es correcta.
 *
 * @param activeBlocks - Bloques de la pieza activa con sus coordenadas mundiales
 * @param patternPiece - La pieza del patrón objetivo con la que comparar
 * @returns Objeto con isValid y razón del fallo si aplica
 */
export function validatePuzzlePlacement(
  activeBlocks: { x: number; y: number; z: number }[],
  patternPiece: PuzzlePiece
): PlacementValidation {
  // Verificar que TODOS los bloques estén en Y=0
  const allAtGroundLevel = activeBlocks.every((block) => block.y === 0);

  if (!allAtGroundLevel) {
    return {
      isValid: false,
      reason: "wrong_y",
    };
  }

  // Obtener celdas actuales (solo X, Z)
  const activeCellsSet = new Set(
    activeBlocks.map((block) => `${block.x},${block.z}`)
  );

  // Obtener celdas del patrón objetivo
  const patternCellsSet = new Set(
    patternPiece.cells.map((cell) => `${cell.x},${cell.z}`)
  );

  // Verificar que ambos conjuntos tengan el mismo tamaño
  if (patternCellsSet.size !== activeCellsSet.size) {
    return {
      isValid: false,
      reason: "wrong_position",
    };
  }

  // Verificar que todas las celdas del patrón estén cubiertas
  const positionsMatch = [...patternCellsSet].every((cell) =>
    activeCellsSet.has(cell)
  );

  if (!positionsMatch) {
    return {
      isValid: false,
      reason: "wrong_position",
    };
  }

  // Verificar que los tiles de la pieza estén conectados
  if (patternPiece.tiles && patternPiece.tiles.length > 0) {
    if (!areTilesConnected(patternPiece.tiles)) {
      return {
        isValid: false,
        reason: "tiles_not_connected",
      };
    }

    // Verificar orientación de todos los tiles (deben ser orientación base)
    const allCorrectOrientation = patternPiece.tiles.every((tile) =>
      isBaseOrientation(tile.orientation)
    );

    if (!allCorrectOrientation) {
      return {
        isValid: false,
        reason: "wrong_orientation",
      };
    }
  }

  return {
    isValid: true,
  };
}

/**
 * Validación detallada que incluye información adicional sobre tiles
 *
 * @param activeBlocks - Bloques de la pieza activa
 * @param patternPiece - Pieza del patrón
 * @returns Validación detallada con info de tiles
 */
export function validatePuzzlePlacementDetailed(
  activeBlocks: { x: number; y: number; z: number }[],
  patternPiece: PuzzlePiece
): DetailedPlacementValidation {
  const basicValidation = validatePuzzlePlacement(activeBlocks, patternPiece);

  // Añadir información de tiles
  const tiles = patternPiece.tiles || [];
  const tilesConnected = tiles.length <= 1 || areTilesConnected(tiles);
  const orientationCorrect = tiles.every((tile) =>
    isBaseOrientation(tile.orientation)
  );

  return {
    ...basicValidation,
    tiles,
    tilesConnected,
    orientationCorrect,
  };
}

/**
 * Verifica si un conjunto de tiles tiene la orientación correcta
 *
 * @param tiles - Array de tiles a verificar
 * @returns true si todos los tiles tienen orientación base
 */
export function validateTilesOrientation(tiles: Tile[]): boolean {
  return tiles.every((tile) => isBaseOrientation(tile.orientation));
}

/**
 * Compara la orientación de dos tiles para verificar si son iguales
 *
 * @param tile1 - Primer tile
 * @param tile2 - Segundo tile
 * @returns true si ambos tienen la misma orientación
 */
export function tilesHaveSameOrientation(tile1: Tile, tile2: Tile): boolean {
  const o1 = tile1.orientation;
  const o2 = tile2.orientation;
  return o1[0] === o2[0] && o1[1] === o2[1] && o1[2] === o2[2] && o1[3] === o2[3];
}

/**
 * Obtiene información de depuración sobre la validación
 *
 * @param activeBlocks - Bloques activos
 * @param patternPiece - Pieza del patrón
 * @returns String con información de depuración
 */
export function getValidationDebugInfo(
  activeBlocks: { x: number; y: number; z: number }[],
  patternPiece: PuzzlePiece
): string {
  const validation = validatePuzzlePlacementDetailed(activeBlocks, patternPiece);

  const lines = [
    `Pieza: ${patternPiece.id} (${patternPiece.type})`,
    `Válida: ${validation.isValid}`,
    validation.reason ? `Razón: ${validation.reason}` : null,
    `Bloques en Y=0: ${activeBlocks.every((b) => b.y === 0)}`,
    `Tiles conectados: ${validation.tilesConnected}`,
    `Orientación correcta: ${validation.orientationCorrect}`,
    `Tiles: ${validation.tiles?.map((t) => t.id).join(", ")}`,
  ].filter(Boolean);

  return lines.join("\n");
}
