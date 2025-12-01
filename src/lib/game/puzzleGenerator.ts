import {
  TetrominoType,
  TETROMINO_SHAPES,
  rotateShapeHorizontal,
} from "./three/tetrominoes";

// Generador aleatorio con seed (Simple LCG)
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

export interface PuzzlePiece {
  id: string;
  type: TetrominoType;
  rotation: number;
  position: { x: number; z: number };
  cells: { x: number; z: number }[];
  tileIndices: number[]; // Índices de las tiles de la imagen asignadas
  placed: boolean; // Si ya fue colocada correctamente
}

interface GridCell {
  x: number;
  z: number;
  occupied: boolean;
  pieceId?: string;
}

/**
 * Genera un patrón de puzzle llenando el grid con piezas de Tetris
 */
export function generatePuzzlePattern(
  gridSize: number,
  seed: number
): PuzzlePiece[] {
  const random = new SeededRandom(seed);
  const pieces: PuzzlePiece[] = [];
  const grid: GridCell[][] = [];

  // Inicializar grid
  for (let x = 0; x < gridSize; x++) {
    grid[x] = [];
    for (let z = 0; z < gridSize; z++) {
      grid[x][z] = { x, z, occupied: false };
    }
  }

  // Tipos de piezas disponibles (priorizando piezas pequeñas para rellenar huecos)
  const pieceTypes: TetrominoType[] = [
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
  ];

  let pieceId = 0;
  const maxAttempts = gridSize * gridSize * 10; // Límite de intentos
  let attempts = 0;

  // Intentar llenar el grid
  while (attempts < maxAttempts) {
    attempts++;

    // Encontrar una celda vacía
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

    // Seleccionar una celda vacía aleatoria
    const startCell =
      emptyCells[random.nextInt(0, emptyCells.length - 1)];

    // Intentar colocar diferentes tipos de piezas
    const shuffledTypes = [...pieceTypes].sort(() => random.next() - 0.5);
    let placed = false;

    for (const type of shuffledTypes) {
      const shape = TETROMINO_SHAPES[type];

      // Intentar todas las rotaciones
      for (let rotation = 0; rotation < 4; rotation++) {
        const rotatedShape = rotateShapeHorizontal(shape, rotation);

        // Verificar si la pieza cabe en esta posición
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
          // Colocar la pieza
          const piece: PuzzlePiece = {
            id: `puzzle-${pieceId++}`,
            type,
            rotation,
            position: { x: startCell.x, z: startCell.z },
            cells,
            tileIndices: [],
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

    // Si no se pudo colocar ninguna pieza, intentar rellenar con I2
    if (!placed && emptyCells.length > 0) {
      const cell = emptyCells[0];
      // Intentar colocar I2 horizontal o vertical
      const i2Shapes = [
        TETROMINO_SHAPES["I2"],
        rotateShapeHorizontal(TETROMINO_SHAPES["I2"], 1),
      ];

      for (const shape of i2Shapes) {
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
            rotation: shape === i2Shapes[1] ? 1 : 0,
            position: { x: cell.x, z: cell.z },
            cells,
            tileIndices: [],
            placed: false,
          };

          for (const c of cells) {
            grid[c.x][c.z].occupied = true;
            grid[c.x][c.z].pieceId = piece.id;
          }

          pieces.push(piece);
          break;
        }
      }
    }
  }

  // Asignar índices de tiles a cada pieza
  // Cada celda del grid corresponde a un tile de la imagen (gridSize x gridSize tiles)
  for (const piece of pieces) {
    piece.tileIndices = piece.cells.map((cell) => {
      // Convertir coordenadas (x, z) a índice lineal
      return cell.z * gridSize + cell.x;
    });
  }

  return pieces;
}

