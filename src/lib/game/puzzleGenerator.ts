import {
  TetrominoType,
  TETROMINO_SHAPES,
  rotateShapeHorizontal,
} from "./three/tetrominoes";
import {
  Tile,
  createTileGrid,
  getTileByGridPosition,
  areTilesConnected,
  validateGridOrientation,
  validateTilesHaveSameBaseOrientation,
  isBaseOrientation,
} from "./puzzleTile";

/**
 * Generador aleatorio con seed (Simple LCG)
 * Permite reproducir el mismo patrón con la misma seed
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2 ** 32;
    return this.seed / 2 ** 32;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Representa una pieza de puzzle con sus tiles asignados
 */
export interface PuzzlePiece {
  /** ID único de la pieza, formato: "puzzle-{n}" */
  id: string;
  /** Tipo de tetromino (I, O, T, S, Z, J, L, I3, I2, O2, L2) */
  type: TetrominoType;
  /** Rotación del patrón (0-3, pasos de 90°) */
  rotation: number;
  /** Posición de origen de la pieza en el grid */
  position: { x: number; z: number };
  /** Celdas que ocupa la pieza en el grid */
  cells: { x: number; z: number }[];
  /** Tiles de la imagen asignados a esta pieza */
  tiles: Tile[];
  /** Si la pieza ya fue colocada correctamente */
  placed: boolean;
}

/**
 * Resultado de la generación del puzzle
 */
export interface PuzzleGenerationResult {
  /** Grid de tiles (imagen cortada) */
  tileGrid: Tile[][];
  /** Piezas de tetris con sus tiles asignados */
  pieces: PuzzlePiece[];
  /** Indica si el grid está 100% cubierto */
  isComplete: boolean;
}

interface GridCell {
  x: number;
  z: number;
  occupied: boolean;
  pieceId?: string;
}

/**
 * Tipos de piezas disponibles para rellenar el puzzle
 * Incluye O1 (1x1) para garantizar que el puzzle siempre sea 100% resoluble
 */
const PIECE_TYPES: TetrominoType[] = [
  "I",
  "O",
  "T",
  "S",
  "Z",
  "J",
  "L",
  "I3",
  "I2",
  "O2",
  "L2",
  "O1", // Pieza de 1 bloque para rellenar huecos individuales
];

/**
 * Rellena el grid con piezas de tetris basado en una seed
 *
 * @param gridSize - Tamaño del grid
 * @param seed - Seed para el generador aleatorio
 * @returns Array de piezas (sin tiles asignados aún)
 */
function fillGridWithTetrominos(
  gridSize: number,
  seed: number
): { pieces: PuzzlePiece[]; occupancyGrid: GridCell[][] } {
  const random = new SeededRandom(seed);
  const pieces: PuzzlePiece[] = [];
  const grid: GridCell[][] = [];

  // Inicializar grid de ocupación
  for (let x = 0; x < gridSize; x++) {
    grid[x] = [];
    for (let z = 0; z < gridSize; z++) {
      grid[x][z] = { x, z, occupied: false };
    }
  }

  let pieceId = 0;
  const maxAttempts = gridSize * gridSize * 10;
  let attempts = 0;

  // Intentar llenar el grid completamente
  while (attempts < maxAttempts) {
    attempts++;

    // Encontrar celdas vacías
    const emptyCells: { x: number; z: number }[] = [];
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        if (!grid[x][z].occupied) {
          emptyCells.push({ x, z });
        }
      }
    }

    if (emptyCells.length === 0) {
      break; // Grid lleno
    }

    // Seleccionar celda vacía aleatoria
    const startCell = emptyCells[random.nextInt(0, emptyCells.length - 1)];

    // Intentar colocar piezas en orden aleatorio
    const shuffledTypes = [...PIECE_TYPES].sort(() => random.next() - 0.5);
    let placed = false;

    for (const type of shuffledTypes) {
      const shape = TETROMINO_SHAPES[type];

      // Intentar todas las rotaciones
      for (let rotation = 0; rotation < 4; rotation++) {
        const rotatedShape = rotateShapeHorizontal(shape, rotation);

        // Verificar si la pieza cabe
        const cells: { x: number; z: number }[] = [];
        let fits = true;

        for (const cell of rotatedShape) {
          const worldX = startCell.x + cell.x;
          const worldZ = startCell.z + cell.z;

          if (
            worldX < 0 ||
            worldX >= gridSize ||
            worldZ < 0 ||
            worldZ >= gridSize ||
            grid[worldX][worldZ].occupied
          ) {
            fits = false;
            break;
          }

          cells.push({ x: worldX, z: worldZ });
        }

        if (fits) {
          const piece: PuzzlePiece = {
            id: `puzzle-${pieceId++}`,
            type,
            rotation,
            position: { x: startCell.x, z: startCell.z },
            cells,
            tiles: [], // Se asignarán después
            placed: false,
          };

          // Marcar celdas como ocupadas
          for (const cell of cells) {
            grid[cell.x][cell.z].occupied = true;
            grid[cell.x][cell.z].pieceId = piece.id;
          }

          pieces.push(piece);
          placed = true;
          break;
        }
      }

      if (placed) break;
    }

    // Fallback: intentar rellenar con piezas pequeñas (I2)
    if (!placed && emptyCells.length > 0) {
      const cell = emptyCells[0];
      const i2Shapes = [
        TETROMINO_SHAPES["I2"],
        rotateShapeHorizontal(TETROMINO_SHAPES["I2"], 1),
      ];

      let i2Placed = false;
      for (let shapeIdx = 0; shapeIdx < i2Shapes.length; shapeIdx++) {
        const shape = i2Shapes[shapeIdx];
        const cells: { x: number; z: number }[] = [];
        let fits = true;

        for (const c of shape) {
          const worldX = cell.x + c.x;
          const worldZ = cell.z + c.z;

          if (
            worldX < 0 ||
            worldX >= gridSize ||
            worldZ < 0 ||
            worldZ >= gridSize ||
            grid[worldX][worldZ].occupied
          ) {
            fits = false;
            break;
          }

          cells.push({ x: worldX, z: worldZ });
        }

        if (fits) {
          const piece: PuzzlePiece = {
            id: `puzzle-${pieceId++}`,
            type: "I2",
            rotation: shapeIdx === 1 ? 1 : 0,
            position: { x: cell.x, z: cell.z },
            cells,
            tiles: [],
            placed: false,
          };

          for (const c of cells) {
            grid[c.x][c.z].occupied = true;
            grid[c.x][c.z].pieceId = piece.id;
          }

          pieces.push(piece);
          i2Placed = true;
          break;
        }
      }

      // Fallback final: usar O1 (1x1) para rellenar huecos individuales
      // Esto garantiza que el puzzle SIEMPRE sea 100% resoluble
      if (!i2Placed && !grid[cell.x][cell.z].occupied) {
        const piece: PuzzlePiece = {
          id: `puzzle-${pieceId++}`,
          type: "O1",
          rotation: 0,
          position: { x: cell.x, z: cell.z },
          cells: [{ x: cell.x, z: cell.z }],
          tiles: [],
          placed: false,
        };

        grid[cell.x][cell.z].occupied = true;
        grid[cell.x][cell.z].pieceId = piece.id;
        pieces.push(piece);
      }
    }
  }

  return { pieces, occupancyGrid: grid };
}

/**
 * Asigna tiles a cada pieza basándose en las celdas que ocupa
 *
 * @param pieces - Piezas sin tiles
 * @param tileGrid - Grid de tiles
 * @returns Piezas con tiles asignados
 */
function assignTilesToPieces(
  pieces: PuzzlePiece[],
  tileGrid: Tile[][]
): PuzzlePiece[] {
  for (const piece of pieces) {
    piece.tiles = piece.cells
      .map((cell) => getTileByGridPosition(tileGrid, cell.x, cell.z))
      .filter((tile): tile is Tile => tile !== undefined);
  }
  return pieces;
}

/**
 * Valida que cada pieza tenga tiles conectados (vecinos entre sí)
 *
 * @param pieces - Piezas con tiles asignados
 * @returns true si todas las piezas tienen tiles conectados
 */
function validatePieceConnectivity(pieces: PuzzlePiece[]): boolean {
  for (const piece of pieces) {
    if (!areTilesConnected(piece.tiles)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Pieza ${piece.id} tiene tiles no conectados:`,
          piece.tiles.map((t) => t.id)
        );
      }
      return false;
    }
  }
  return true;
}

/**
 * Valida que TODOS los tiles de TODAS las piezas tengan orientación base [1,2,3,4]
 *
 * ESTO ES CRUCIAL: Si algún tile tiene orientación diferente, la imagen no se verá correctamente
 *
 * @param pieces - Piezas con tiles asignados
 * @returns true si todos los tiles de todas las piezas tienen orientación [1,2,3,4]
 */
function validatePieceTilesOrientation(pieces: PuzzlePiece[]): boolean {
  let allValid = true;

  for (const piece of pieces) {
    // Verificar que todos los tiles de esta pieza tengan orientación base
    if (!validateTilesHaveSameBaseOrientation(piece.tiles)) {
      allValid = false;
      if (process.env.NODE_ENV === "development") {
        console.error(
          `⚠️ PIEZA ${piece.id} (${piece.type}): Tiles con orientación incorrecta`
        );

        // Mostrar detalles de cada tile
        piece.tiles.forEach((tile) => {
          const isValid = isBaseOrientation(tile.orientation);
          if (!isValid) {
            console.error(
              `  - Tile ${tile.id}: [${tile.orientation.join(",")}] ≠ [1,2,3,4]`
            );
          }
        });
      }
    }
  }

  if (allValid && process.env.NODE_ENV === "development") {
    console.log(
      `✅ Validación de orientación: ${pieces.length} piezas, todos los tiles tienen orientación [1,2,3,4]`
    );
  }

  return allValid;
}

/**
 * Verifica si el grid está completamente cubierto
 *
 * @param occupancyGrid - Grid de ocupación
 * @returns true si no hay celdas vacías
 */
function isGridComplete(occupancyGrid: GridCell[][]): boolean {
  for (const row of occupancyGrid) {
    for (const cell of row) {
      if (!cell.occupied) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Genera un patrón de puzzle completo con tiles y piezas de tetris
 *
 * Flujo:
 * 1. Crea el grid de tiles con orientación base y neighbors
 * 2. Valida que TODOS los tiles tengan orientación [1,2,3,4] (CRUCIAL)
 * 3. Rellena el grid con piezas de tetris (basado en seed)
 * 4. Asigna tiles a cada pieza según las celdas que ocupa
 * 5. Valida conectividad de tiles en cada pieza
 * 6. Valida orientación de tiles en cada pieza
 *
 * @param gridSize - Tamaño del grid (6, 8, o 10)
 * @param seed - Seed para generar patrón reproducible
 * @returns Resultado con tileGrid, piezas y estado de completitud
 */
export function generatePuzzlePattern(
  gridSize: number,
  seed: number
): PuzzleGenerationResult {
  if (process.env.NODE_ENV === "development") {
    console.log(`🧩 Generando puzzle ${gridSize}x${gridSize} con seed ${seed}`);
  }

  // Paso 1: Crear grid de tiles
  const tileGrid = createTileGrid(gridSize);

  // Paso 2: VALIDACIÓN CRUCIAL - Verificar que TODOS los tiles tengan orientación [1,2,3,4]
  const gridOrientationValidation = validateGridOrientation(tileGrid);
  if (!gridOrientationValidation.isValid) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `❌ FALLO CRÍTICO: ${gridOrientationValidation.invalidTiles.length} tiles tienen orientación incorrecta`
      );
    }
    // En producción, esto nunca debería pasar ya que createTileGrid siempre asigna [1,2,3,4]
  } else if (process.env.NODE_ENV === "development") {
    console.log(
      `✅ Grid de tiles: ${gridOrientationValidation.totalTiles} tiles con orientación [1,2,3,4]`
    );
  }

  // Paso 3: Rellenar con piezas de tetris
  const { pieces, occupancyGrid } = fillGridWithTetrominos(gridSize, seed);

  // Paso 4: Asignar tiles a piezas
  assignTilesToPieces(pieces, tileGrid);

  // Paso 5: Validar conectividad
  const isConnected = validatePieceConnectivity(pieces);
  if (!isConnected && process.env.NODE_ENV === "development") {
    console.warn("⚠️ Algunas piezas tienen tiles no conectados");
  }

  // Paso 6: VALIDACIÓN CRUCIAL - Verificar orientación de tiles en cada pieza
  const tilesOrientationValid = validatePieceTilesOrientation(pieces);
  if (!tilesOrientationValid && process.env.NODE_ENV === "development") {
    console.error(
      "❌ FALLO CRÍTICO: Algunas piezas tienen tiles con orientación incorrecta"
    );
  }

  // Verificar completitud del grid
  const isComplete = isGridComplete(occupancyGrid);
  if (process.env.NODE_ENV === "development") {
    console.log(
      `📊 Resultado: ${pieces.length} piezas, grid ${
        isComplete ? "completo" : "incompleto"
      }`
    );
  }

  return {
    tileGrid,
    pieces,
    isComplete,
  };
}

/**
 * Obtiene las piezas del puzzle (para compatibilidad con código existente)
 * @deprecated Usar generatePuzzlePattern().pieces en su lugar
 */
export function generatePuzzlePieces(
  gridSize: number,
  seed: number
): PuzzlePiece[] {
  return generatePuzzlePattern(gridSize, seed).pieces;
}
