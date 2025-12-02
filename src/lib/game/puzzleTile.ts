/**
 * Sistema de Tiles para el Puzzle 2D
 *
 * Cada tile representa una celda de la imagen del puzzle cortada en un grid.
 * La orientación se usa para validar que el tile no esté rotado.
 * Los neighbors se usan para validar que los tiles de una pieza sean adyacentes reales.
 */

/**
 * Orientación de las esquinas del tile en sentido horario.
 * Base (sin rotar, imagen hacia abajo ⬇️): [1, 2, 3, 4]
 * - 1: Esquina superior izquierda
 * - 2: Esquina superior derecha
 * - 3: Esquina inferior derecha
 * - 4: Esquina inferior izquierda
 *
 * Ejemplos de rotaciones:
 * - 0°   (⬇️): [1, 2, 3, 4]
 * - 90°  (➡️): [4, 1, 2, 3]
 * - 180° (⬆️): [3, 4, 1, 2]
 * - 270° (⬅️): [2, 3, 4, 1]
 */
export type TileOrientation = [number, number, number, number];

/**
 * IDs de los tiles vecinos (adyacentes en la imagen original)
 */
export interface TileNeighbors {
  top?: string; // ID del tile arriba (row - 1)
  right?: string; // ID del tile a la derecha (column + 1)
  bottom?: string; // ID del tile abajo (row + 1)
  left?: string; // ID del tile a la izquierda (column - 1)
}

/**
 * Representa un tile individual de la imagen del puzzle
 */
export interface Tile {
  /** ID único del tile, formato: "tile-{row}-{column}" */
  id: string;
  /** Fila en la imagen (0 a gridSize-1), corresponde al eje Z en el espacio de juego */
  row: number;
  /** Columna en la imagen (0 a gridSize-1), corresponde al eje X en el espacio de juego */
  column: number;
  /** Posición en el espacio de juego (x = column, z = row) */
  gridPosition: { x: number; z: number };
  /** Orientación de las esquinas en sentido horario. Base sin rotar: [1, 2, 3, 4] */
  orientation: TileOrientation;
  /** IDs de los tiles adyacentes en la imagen original */
  neighbors: TileNeighbors;
}

/**
 * Orientación base para tiles sin rotar (imagen hacia abajo ⬇️)
 */
export const BASE_ORIENTATION: TileOrientation = [1, 2, 3, 4];

/**
 * Genera el ID de un tile basado en su posición
 */
export function getTileId(row: number, column: number): string {
  return `tile-${row}-${column}`;
}

/**
 * Crea un grid de tiles para el puzzle.
 * Cada tile tiene su orientación base y sus neighbors calculados.
 *
 * IMPORTANTE: El mapeo de row a gridPosition.z está INVERTIDO para que:
 * - row=0 (parte SUPERIOR de la imagen) → gridPosition.z = gridSize-1 (Z alto, más cerca de la cámara)
 * - row=gridSize-1 (parte INFERIOR de la imagen) → gridPosition.z = 0 (Z bajo, más lejos)
 *
 * Esto asegura que la imagen se vea correctamente desde la cámara del jugador:
 * - El "techo" de la imagen (row=0) está arriba visualmente
 * - La "base" de la imagen (row=gridSize-1) está abajo visualmente
 *
 * @param gridSize - Tamaño del grid (6, 8, o 10)
 * @returns Matriz 2D de tiles [row][column]
 */
export function createTileGrid(gridSize: number): Tile[][] {
  const grid: Tile[][] = [];

  // Crear todos los tiles con orientación base
  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let column = 0; column < gridSize; column++) {
      const tile: Tile = {
        id: getTileId(row, column),
        row,
        column,
        gridPosition: {
          x: column, // Columna = eje X (sin cambio)
          z: gridSize - 1 - row, // Fila INVERTIDA = eje Z (row=0 → Z alto)
        },
        orientation: [...BASE_ORIENTATION] as TileOrientation,
        neighbors: {},
      };
      grid[row][column] = tile;
    }
  }

  // Calcular neighbors para cada tile
  for (let row = 0; row < gridSize; row++) {
    for (let column = 0; column < gridSize; column++) {
      const tile = grid[row][column];

      // Tile arriba (row - 1)
      if (row > 0) {
        tile.neighbors.top = getTileId(row - 1, column);
      }

      // Tile a la derecha (column + 1)
      if (column < gridSize - 1) {
        tile.neighbors.right = getTileId(row, column + 1);
      }

      // Tile abajo (row + 1)
      if (row < gridSize - 1) {
        tile.neighbors.bottom = getTileId(row + 1, column);
      }

      // Tile a la izquierda (column - 1)
      if (column > 0) {
        tile.neighbors.left = getTileId(row, column - 1);
      }
    }
  }

  return grid;
}

/**
 * Obtiene un tile del grid por su posición
 */
export function getTileAt(
  grid: Tile[][],
  row: number,
  column: number
): Tile | undefined {
  if (row < 0 || row >= grid.length) return undefined;
  if (column < 0 || column >= grid[row].length) return undefined;
  return grid[row][column];
}

/**
 * Obtiene un tile del grid por sus coordenadas de juego (x, z)
 *
 * IMPORTANTE: El mapeo de z a row está INVERTIDO porque:
 * - gridPosition.z = gridSize - 1 - row
 * - Por lo tanto: row = gridSize - 1 - z
 */
export function getTileByGridPosition(
  grid: Tile[][],
  x: number,
  z: number
): Tile | undefined {
  const gridSize = grid.length;
  if (gridSize === 0) return undefined;

  // x = column (sin cambio)
  // z → row invertido: row = gridSize - 1 - z
  const row = gridSize - 1 - z;
  const column = x;

  return getTileAt(grid, row, column);
}

/**
 * Verifica si dos tiles son vecinos (adyacentes en la imagen original)
 */
export function areTilesNeighbors(tile1: Tile, tile2: Tile): boolean {
  const neighbors = tile1.neighbors;
  return (
    neighbors.top === tile2.id ||
    neighbors.right === tile2.id ||
    neighbors.bottom === tile2.id ||
    neighbors.left === tile2.id
  );
}

/**
 * Verifica si un conjunto de tiles forman un grupo conectado (todos son vecinos entre sí)
 * Usa BFS para verificar conectividad
 */
export function areTilesConnected(tiles: Tile[]): boolean {
  if (tiles.length <= 1) return true;

  const tileIds = new Set(tiles.map((t) => t.id));
  const visited = new Set<string>();
  const queue: Tile[] = [tiles[0]];
  visited.add(tiles[0].id);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Obtener vecinos que están en nuestro conjunto
    const neighborIds = [
      current.neighbors.top,
      current.neighbors.right,
      current.neighbors.bottom,
      current.neighbors.left,
    ].filter((id): id is string => id !== undefined && tileIds.has(id));

    for (const neighborId of neighborIds) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const neighborTile = tiles.find((t) => t.id === neighborId);
        if (neighborTile) {
          queue.push(neighborTile);
        }
      }
    }
  }

  // Todos los tiles deben haber sido visitados
  return visited.size === tiles.length;
}

/**
 * Compara dos orientaciones para verificar si son iguales
 */
export function orientationsMatch(
  o1: TileOrientation,
  o2: TileOrientation
): boolean {
  return o1[0] === o2[0] && o1[1] === o2[1] && o1[2] === o2[2] && o1[3] === o2[3];
}

/**
 * Verifica si una orientación es la orientación base (sin rotar)
 */
export function isBaseOrientation(orientation: TileOrientation): boolean {
  return orientationsMatch(orientation, BASE_ORIENTATION);
}

/**
 * Rota una orientación 90 grados en sentido horario
 */
export function rotateOrientationClockwise(
  orientation: TileOrientation
): TileOrientation {
  return [orientation[3], orientation[0], orientation[1], orientation[2]];
}

/**
 * Calcula cuántas rotaciones de 90° se necesitan para llegar de una orientación a otra
 * Retorna -1 si las orientaciones no son compatibles (no son rotaciones de la misma base)
 */
export function getRotationDifference(
  from: TileOrientation,
  to: TileOrientation
): number {
  let current = [...from] as TileOrientation;

  for (let rotations = 0; rotations < 4; rotations++) {
    if (orientationsMatch(current, to)) {
      return rotations;
    }
    current = rotateOrientationClockwise(current);
  }

  return -1; // No son compatibles
}

/**
 * Resultado de la validación de orientación del grid
 */
export interface GridOrientationValidation {
  /** Si TODOS los tiles tienen orientación base [1,2,3,4] */
  isValid: boolean;
  /** Total de tiles en el grid */
  totalTiles: number;
  /** Tiles con orientación correcta */
  validTiles: number;
  /** Tiles con orientación incorrecta (rotados) */
  invalidTiles: Tile[];
}

/**
 * Valida que TODOS los tiles del grid tengan orientación base [1,2,3,4]
 *
 * ESTO ES CRUCIAL para el correcto funcionamiento del puzzle:
 * - Todos los tiles DEBEN tener la misma orientación ⬇️
 * - Si algún tile tiene orientación diferente, la imagen no se verá correctamente
 * - Cada tile debe tener [1,2,3,4] donde:
 *   - 1 = esquina superior izquierda
 *   - 2 = esquina superior derecha
 *   - 3 = esquina inferior derecha
 *   - 4 = esquina inferior izquierda
 *
 * @param tileGrid - Grid de tiles a validar
 * @returns Resultado con isValid y lista de tiles inválidos
 */
export function validateGridOrientation(
  tileGrid: Tile[][]
): GridOrientationValidation {
  const invalidTiles: Tile[] = [];
  let totalTiles = 0;

  for (const row of tileGrid) {
    for (const tile of row) {
      totalTiles++;
      if (!isBaseOrientation(tile.orientation)) {
        invalidTiles.push(tile);
      }
    }
  }

  const isValid = invalidTiles.length === 0;
  const validTiles = totalTiles - invalidTiles.length;

  // Log de warning si hay tiles inválidos
  if (!isValid) {
    console.error(
      `⚠️ VALIDACIÓN DE ORIENTACIÓN FALLIDA: ${invalidTiles.length}/${totalTiles} tiles tienen orientación incorrecta`
    );
    invalidTiles.forEach((tile) => {
      console.error(
        `  - Tile ${tile.id} (row:${tile.row}, col:${tile.column}): orientación [${tile.orientation.join(",")}] ≠ [1,2,3,4]`
      );
    });
  }

  return {
    isValid,
    totalTiles,
    validTiles,
    invalidTiles,
  };
}

/**
 * Valida que todos los tiles de un array tengan la misma orientación base [1,2,3,4]
 *
 * @param tiles - Array de tiles a validar
 * @returns true si todos tienen orientación [1,2,3,4]
 */
export function validateTilesHaveSameBaseOrientation(tiles: Tile[]): boolean {
  if (tiles.length === 0) return true;

  // Todos deben tener orientación base [1,2,3,4]
  return tiles.every((tile) => isBaseOrientation(tile.orientation));
}

/**
 * Formatea la orientación de un tile para mostrar visualmente
 *
 * Ejemplo de salida para [1,2,3,4]:
 * "1, 2"
 * "4, 3"
 */
export function formatTileOrientation(orientation: TileOrientation): string {
  return `${orientation[0]}, ${orientation[1]}\n${orientation[3]}, ${orientation[2]}`;
}

/**
 * Compara la orientación de dos tiles y retorna si son iguales
 * Útil para verificar que tiles vecinos tengan la misma orientación
 */
export function compareTileOrientations(
  tile1: Tile,
  tile2: Tile
): {
  match: boolean;
  tile1Orientation: string;
  tile2Orientation: string;
} {
  const match = orientationsMatch(tile1.orientation, tile2.orientation);
  return {
    match,
    tile1Orientation: formatTileOrientation(tile1.orientation),
    tile2Orientation: formatTileOrientation(tile2.orientation),
  };
}

