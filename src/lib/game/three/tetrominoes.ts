export type TetrominoType =
  | "I"
  | "O"
  | "T"
  | "S"
  | "Z"
  | "J"
  | "L"
  | "I3"
  | "I2"
  | "O2"
  | "L2";

export interface TetrominoCell {
  x: number;
  y: number;
  z: number;
}

export type TetrominoShape = TetrominoCell[];

export const TETROMINO_SHAPES: Record<TetrominoType, TetrominoShape> = {
  // Línea horizontal de 4 bloques
  I: [
    { x: -2, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ],
  // Cuadrado 2x2
  O: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
  ],
  // Forma T
  T: [
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
  ],
  // Forma S
  S: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 1 },
    { x: 0, y: 0, z: 1 },
  ],
  // Forma Z
  Z: [
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
  ],
  // Forma J
  J: [
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 1 },
  ],
  // Forma L
  L: [
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 0, z: 1 },
  ],
  // I pequeña (3 bloques verticales)
  I3: [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: 2 },
  ],
  // I muy pequeña (2 bloques verticales)
  I2: [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
  ],
  // O pequeña (2 bloques horizontales)
  O2: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ],
  // L pequeña (2 verticales + 1 horizontal abajo)
  L2: [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
  ],
};

/**
 * Rota una celda alrededor del eje Y en pasos de 90 grados.
 * rotationSteps: 0 = 0°, 1 = 90°, 2 = 180°, 3 = 270°
 */
export function rotateCellHorizontal(
  cell: TetrominoCell,
  rotationSteps: number,
): TetrominoCell {
  const steps = ((rotationSteps % 4) + 4) % 4;
  const y = cell.y;
  let x = cell.x;
  let z = cell.z;

  for (let i = 0; i < steps; i += 1) {
    // Rotación 90° en el plano XZ alrededor de Y:
    // (x, z) -> (-z, x)
    const newX = -z;
    const newZ = x;
    x = newX;
    z = newZ;
  }

  return { x, y, z };
}

export function rotateShapeHorizontal(
  shape: TetrominoShape,
  rotationSteps: number,
): TetrominoShape {
  return shape.map((cell) => rotateCellHorizontal(cell, rotationSteps));
}


