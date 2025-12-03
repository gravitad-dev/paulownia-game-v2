# Guía de Desarrollo del Juego Puzzle-Tetris 3D

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Sistema de Coordenadas](#3-sistema-de-coordenadas)
4. [Flujo del Juego](#4-flujo-del-juego)
5. [Sistema de Piezas Puzzle](#5-sistema-de-piezas-puzzle)
6. [Sistema de Limpieza de Líneas](#6-sistema-de-limpieza-de-líneas)
7. [Estados del Juego](#7-estados-del-juego)
8. [Stores (Zustand)](#8-stores-zustand)
9. [Componentes Principales](#9-componentes-principales)
10. [Guía de Modificaciones](#10-guía-de-modificaciones)
11. [Errores Comunes y Soluciones](#11-errores-comunes-y-soluciones)
12. [Optimizaciones de Rendimiento](#12-optimizaciones-de-rendimiento)

---

## 1. Visión General

Este es un juego híbrido que combina **Tetris 3D** con un **Puzzle de imagen**. El objetivo es colocar piezas de Tetris en sus posiciones correctas para reconstruir una imagen dividida en tiles.

### Características Principales

- **Grid 3D**: Las piezas caen en un espacio tridimensional
- **Piezas Puzzle**: Cada pieza tiene tiles de imagen asignados que deben coincidir con el patrón
- **Sistema de Bloqueo**: Las piezas puzzle colocadas correctamente se bloquean y no pueden ser eliminadas
- **Limpieza de Líneas**: Similar a Tetris, pero protegiendo las piezas puzzle bloqueadas

### Dificultades

| Dificultad | Tamaño del Grid |
| ---------- | --------------- |
| Easy       | 6x6x6           |
| Medium     | 8x8x8           |
| Hard       | 10x10x10        |

---

## 2. Arquitectura del Sistema

```
src/
├── lib/game/                    # Lógica del juego (sin React)
│   ├── puzzleGenerator.ts       # Genera piezas puzzle con tiles asignados
│   ├── puzzleTile.ts            # Sistema de tiles y orientaciones
│   ├── puzzleValidation.ts      # Validación de colocación de piezas
│   └── three/
│       ├── grid3d.ts            # Tipos y funciones del grid 3D
│       └── tetrominoes.ts       # Definiciones de formas de Tetrominos
│
├── components/game/
│   ├── Game.tsx                 # Componente principal del juego
│   ├── PuzzleFloor.tsx          # Renderiza la imagen en el suelo
│   └── PuzzleTileCube.tsx       # Renderiza cubos con textura de tile
│
└── store/
    ├── usePuzzleStore.ts        # Estado del puzzle (piezas, tiles)
    ├── useCameraConfigStore.ts  # Configuración de cámara
    └── useGameSpeedStore.ts     # Velocidad del juego
```

### Flujo de Datos

```
puzzleGenerator.ts
       │
       ├── Genera tileGrid (matriz de tiles con orientación)
       ├── Genera pieces (array de PuzzlePiece)
       └── Asigna tiles a cada pieza
              │
              ▼
    usePuzzleStore.ts
              │
              ├── Almacena pattern (piezas originales)
              ├── Mantiene remainingPieces (piezas por colocar)
              ├── Mantiene placedPieces (piezas correctamente colocadas)
              └── Rastrea currentPuzzlePiece (pieza cayendo)
              │
              ▼
        Game.tsx
              │
              ├── Maneja lógica de caída y colisiones
              ├── Valida colocación de piezas
              ├── Gestiona limpieza de líneas
              └── Renderiza escena 3D
```

---

## 3. Sistema de Coordenadas

### 3.1 Espacio 3D de Three.js

```
        Y (arriba - altura)
        │
        │
        │_______ X (derecha)
       /
      /
     Z (hacia la cámara)
```

### 3.2 Grid del Juego

```
Grid[x][y][z]:
- x: 0 a size-1 (columnas, izquierda → derecha)
- y: 0 a size-1 (altura, abajo → arriba)
- z: 0 a size-1 (profundidad, lejos → cerca)
```

### 3.3 Mapeo Imagen → Grid → Mundo

| Concepto          | Imagen (2D) | Grid Interno         | Espacio 3D    |
| ----------------- | ----------- | -------------------- | ------------- |
| Horizontal        | column      | tile.column / cell.x | X             |
| Vertical (imagen) | row         | ---                  | ---           |
| Profundidad       | ---         | tile.row / cell.z    | Z (INVERTIDO) |

**IMPORTANTE**: El mapeo de `row` a `Z` está **INVERTIDO**:

- `row = 0` (parte superior de imagen) → `Z = gridSize - 1` (cerca de cámara)
- `row = gridSize-1` (parte inferior) → `Z = 0` (lejos de cámara)

```typescript
// Fórmulas de conversión
gridPosition.z = gridSize - 1 - row;
row = gridSize - 1 - gridPosition.z;
```

### 3.4 Posición Mundial de Celdas

```typescript
// En grid3d.ts
function getCellWorldPosition(x, y, z, size): [number, number, number] {
  const offset = (size - 1) / 2;
  return [x - offset, y - offset, z - offset];
}
```

El grid se centra en el origen, así:

- Grid 6x6: celdas van de -2.5 a 2.5 en cada eje
- Celda (0,0,0) está en posición mundial (-2.5, -2.5, -2.5)

---

## 4. Flujo del Juego

### 4.1 Inicialización

```
1. Game.tsx recibe difficulty y puzzleImageUrl
2. Se genera el patrón de puzzle:
   - createTileGrid(size) → matriz de tiles
   - fillGridWithTetrominos(size, seed) → piezas con celdas
   - assignTilesToPieces() → asigna tiles a cada pieza
3. Se inicializa puzzleStore con el patrón
4. Se configura la primera pieza puzzle para caer
```

### 4.2 Loop Principal (tick)

```typescript
// Ejecutado en useEffect con requestAnimationFrame
// OPTIMIZACIÓN: Usa refs para valores frecuentes, solo depende de valores estables
const tick = () => {
  // 1. Calcular tiempo desde último tick
  const deltaTime = now - lastTickTime;

  // 2. Si ha pasado suficiente tiempo, bajar la pieza
  if (deltaTime >= cycleTime) {
    // Usar refs en lugar de estado directo (evita re-crear el useEffect)
    const currentPosition = activePositionRef.current;
    const currentShape = activeShapeRef.current;

    // Intentar mover hacia abajo
    if (!checkCollision(nextBlocks)) {
      setActivePosition(nextPosition);
    } else {
      // Colisión: fijar pieza
      lockPiece();
    }
  }
};
// Dependencias: [size, cycleTime, puzzleImageUrl, ...] (solo valores estables)
```

### 4.3 Colocación de Piezas

```
1. Pieza colisiona (no puede bajar más)
2. Si es pieza puzzle:
   a. Validar posición (validatePuzzlePlacement)
   b. Si válida:
      - Marcar como colocada (placePiece)
      - Añadir a lockedPieces
   c. Si inválida:
      - Se degrada a pieza normal
3. Añadir bloques al grid
4. Detectar y limpiar líneas completas
5. Generar nueva pieza
```

---

## 5. Sistema de Piezas Puzzle

### 5.1 Estructura de PuzzlePiece

```typescript
interface PuzzlePiece {
  id: string; // Ej: "puzzle-0"
  type: TetrominoType; // Ej: "I", "T", "L"
  rotation: number; // 0-3 (pasos de 90°)
  position: { x: number; z: number }; // Origen en el grid
  cells: { x: number; z: number }[]; // Celdas que ocupa
  tiles: Tile[]; // Tiles de imagen asignados
  placed: boolean; // Si ya fue colocada correctamente
}
```

### 5.2 Tipos de Tetrominos

```typescript
// En tetrominoes.ts
type TetrominoType =
  | "I" // Línea 4 bloques
  | "O" // Cuadrado 2x2
  | "T" // Forma T
  | "S" // Forma S
  | "Z" // Forma Z
  | "J" // Forma J
  | "L" // Forma L
  | "I3" // Línea 3 bloques
  | "I2" // Línea 2 bloques
  | "O2" // Horizontal 2 bloques
  | "L2" // L pequeña (3 bloques)
  | "O1"; // Bloque único
```

### 5.3 Rotación de Piezas

```typescript
// Rotación en plano XZ (alrededor del eje Y)
function rotateCellHorizontal(cell, rotationSteps): TetrominoCell {
  // (x, z) → (-z, x) por cada paso de 90°
  for (let i = 0; i < steps; i++) {
    const newX = -z;
    const newZ = x;
    x = newX;
    z = newZ;
  }
  return { x, y, z };
}
```

**IMPORTANTE**: Las piezas puzzle NO se pueden rotar durante el juego. La rotación se define al generar el patrón.

### 5.4 Validación de Colocación

```typescript
function validatePuzzlePlacement(
  activeBlocks,
  patternPiece
): PlacementValidation {
  // 1. Todos los bloques deben estar en Y=0
  // 2. Las coordenadas X,Z deben coincidir con el patrón
  // 3. Los tiles deben estar conectados
  // 4. Los tiles deben tener orientación base [1,2,3,4]
}
```

---

## 6. Sistema de Limpieza de Líneas

### 6.1 Conceptos Clave

- **Línea completa**: Todos los bloques en una fila X o Z en un nivel Y están "filled"
- **Posiciones bloqueadas**: Celdas de piezas puzzle correctamente colocadas
- **Comportamiento**: Las líneas completas se eliminan, EXCEPTO las posiciones bloqueadas

### 6.2 Flujo de Limpieza

```
1. detectLineClears(grid, level, lockedPositions)
   - Detecta líneas completas en X y Z
   - Retorna bloques a eliminar (excluyendo bloqueados)

2. applyLineClearToGrid(grid, level, lockedPositions)
   - Fase 1: Detectar TODAS las líneas completas (Z y X) SIN modificar el grid
   - Fase 2: Recopilar columnas a desplazar en un Set<string> (evita duplicados)
   - Fase 3: Aplicar shiftColumnDown a todas las columnas en bloque
   - El while loop repite hasta que no haya más líneas (cascadas)

3. processLineClearsIteratively(grid, lockedPositions)
   - Repite el proceso en todos los niveles Y (0 a MAX_STACK_HEIGHT)
   - Retorna grid final y bloques eliminados
```

**IMPORTANTE**: La detección de líneas X y Z se hace **antes** de modificar el grid.
Esto garantiza que cuando se completan líneas en ambas direcciones (cruz o L),
se eliminan todas simultáneamente en lugar de solo una.

### 6.3 Cálculo de lockedPositions

```typescript
// lockedPositions es un Set<string> con formato "x,z"
const lockedPositions = new Set<string>();

// Añadir celdas de piezas ya colocadas
puzzleStore.placedPieces.forEach((piece) => {
  if (lockedPieceIds.has(piece.id)) {
    piece.cells.forEach((c) => {
      lockedPositions.add(`${c.x},${c.z}`);
    });
  }
});

// IMPORTANTE: Añadir celdas de pieza recién colocada
// (Zustand no actualiza el hook hasta el siguiente render)
if (isPuzzleCorrectlyPlaced && currentPuzzlePiece) {
  patternPiece.cells.forEach((c) => {
    lockedPositions.add(`${c.x},${c.z}`);
  });
}
```

---

## 7. Estados del Juego

```typescript
type GameState = "waiting" | "playing" | "gameover" | "victory";
```

| Estado     | Descripción                                | Transiciones             |
| ---------- | ------------------------------------------ | ------------------------ |
| `waiting`  | Pantalla inicial (solo con puzzleImageUrl) | → `playing`              |
| `playing`  | Juego activo                               | → `gameover` / `victory` |
| `gameover` | Perdió (pieza en límite superior)          | → `waiting` (restart)    |
| `victory`  | Ganó (todas las piezas puzzle colocadas)   | → `waiting` (restart)    |

---

## 8. Stores (Zustand)

### 8.1 usePuzzleStore

```typescript
interface PuzzleState {
  seed: number; // Seed para reproducibilidad
  tileGrid: Tile[][]; // Grid de tiles de imagen
  pattern: PuzzlePiece[]; // Patrón original
  remainingPieces: PuzzlePiece[]; // Piezas por colocar
  placedPieces: PuzzlePiece[]; // Piezas correctamente colocadas
  pieceCounter: number; // Contador para alternar puzzle/normal
  currentPuzzlePiece: PuzzlePiece | null; // Pieza cayendo
  isComplete: boolean; // Puzzle terminado
  testMode: boolean; // Solo piezas puzzle (no normales)

  // Actions
  initializeFromResult(seed, result): void;
  placePiece(pieceId): void;
  setCurrentPuzzlePiece(piece): void;
  incrementPieceCounter(): void;
  reset(): void;
  getTileAt(x, z): Tile | undefined;
}
```

**Patrón de uso optimizado** (ver sección 12.2):

```typescript
// Selectores específicos (recomendado)
const currentPuzzlePiece = usePuzzleStore((state) => state.currentPuzzlePiece);
const pattern = usePuzzleStore((state) => state.pattern);

// Actions sin suscripción
const puzzleActions = usePuzzleStore.getState();
puzzleActions.placePiece(id);
```

### 8.2 useCameraConfigStore

Almacena configuración de cámara (distancia, altura, offset).

### 8.3 useGameSpeedStore

Almacena `cycleTime` (milisegundos entre movimientos).

---

## 9. Componentes Principales

### 9.1 Game.tsx

**Responsabilidades:**

- Renderiza escena 3D con React Three Fiber
- Maneja input de teclado (movimiento, rotación)
- Ejecuta loop del juego (tick)
- Gestiona estados del juego
- Coordina limpieza de líneas

**Estados Internos Clave:**

```typescript
const [grid, setGrid] = useState<Grid3D>(...);           // Grid lógico
const [activeType, setActiveType] = useState(...);       // Tipo de pieza actual
const [activeRotation, setActiveRotation] = useState(0); // Rotación actual
const [activePosition, setActivePosition] = useState(...); // Posición actual
const [visualBlocks, setVisualBlocks] = useState(...);   // Bloques con animación
const [lockedPieces, setLockedPieces] = useState(...);   // IDs de piezas bloqueadas
```

**Selectores de Zustand (optimizados):**

```typescript
// Selectores específicos en lugar de usePuzzleStore()
const currentPuzzlePiece = usePuzzleStore((state) => state.currentPuzzlePiece);
const pattern = usePuzzleStore((state) => state.pattern);
const remainingPieces = usePuzzleStore((state) => state.remainingPieces);
const placedPieces = usePuzzleStore((state) => state.placedPieces);

// Actions sin suscripción
const puzzleActions = usePuzzleStore.getState();
```

**Refs para el Tick Loop:**

```typescript
// Refs que el tick loop usa para evitar dependencias excesivas
const activePositionRef = useRef(activePosition);
const activeShapeRef = useRef(activeShape);
const gridRef = useRef(grid);
// Se sincronizan con useEffect individuales
```

### 9.2 PuzzleFloor.tsx

Renderiza la imagen completa del puzzle en el suelo (Y = -halfSize).

```typescript
<PuzzleFloor
  imageUrl={puzzleImageUrl}
  size={size} // Tamaño del plano
  gridSize={size} // Número de tiles
  position={[0, -halfSize, 0]}
/>
```

### 9.3 PuzzleTileCube.tsx

Renderiza un cubo con la textura del tile correspondiente. Memoizado con `React.memo` y usa caché global de materiales.

```typescript
<PuzzleTileCube
  position={[worldX, worldY, worldZ]}
  imageUrl={puzzleImageUrl}
  gridSize={size}
  tileX={cell.x} // Columna del tile
  tileZ={cell.z} // Fila del tile (se invierte en shader)
/>
```

**Optimización**: Los `ShaderMaterial` se cachean globalmente por `(gridSize, tileX, tileZ)` para evitar crear nuevos en cada render.

---

## 10. Guía de Modificaciones

### 10.1 Añadir Nuevo Tipo de Tetromino

1. **En `tetrominoes.ts`**:

```typescript
// Añadir al type
type TetrominoType = ... | "NewPiece";

// Añadir la forma
TETROMINO_SHAPES: {
  NewPiece: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    // ...más celdas
  ],
}
```

2. **En `puzzleGenerator.ts`**:

```typescript
const PIECE_TYPES: TetrominoType[] = [
  ...,
  "NewPiece",
];
```

### 10.2 Modificar Velocidad del Juego

```typescript
// En useGameSpeedStore.ts
const useGameSpeedStore = create((set) => ({
  cycleTime: 1000, // Milisegundos entre movimientos (menor = más rápido)
  setCycleTime: (time) => set({ cycleTime: time }),
}));
```

### 10.3 Añadir Nueva Dificultad

1. **En `grid3d.ts`**:

```typescript
type GameDifficulty = "easy" | "medium" | "hard" | "extreme";

const DIFFICULTY_TO_SIZE: Record<GameDifficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 10,
  extreme: 12, // Nueva dificultad
};
```

### 10.4 Modificar Sistema de Puntuación

El sistema de puntuación no está implementado en el código base. Para añadirlo:

1. Crear `useScoreStore.ts`
2. Incrementar puntos en eventos:
   - Pieza colocada correctamente
   - Línea eliminada
   - Combo de líneas
3. Mostrar puntuación en UI

---

## 11. Errores Comunes y Soluciones

### Error: "Piezas puzzle desaparecen al completar línea"

**Causa**: `lockedPositions` no incluye la pieza recién colocada.

**Solución**: Calcular `lockedPositions` ANTES de llamar a `processLineClearsIteratively`, incluyendo las celdas de la pieza recién colocada.

### Error: "Pieza puzzle viene con rotación incorrecta"

**Causa**: Se usa `setActiveRotation(0)` en lugar de `piece.rotation`.

**Solución**: Al inicializar una pieza puzzle, usar:

```typescript
setActiveRotation(puzzlePiece.rotation);
```

### Error: "Imagen de tiles invertida respecto al suelo"

**Causa**: Falta la inversión de `tileZ` en el shader.

**Solución**: En el shader, usar:

```glsl
float invertedZ = u_gridSize - 1.0 - u_tileZ;
```

### Error: "Tiles no coinciden con el patrón"

**Causa**: Mapeo incorrecto entre coordenadas de grid y tiles.

**Solución**: Usar las fórmulas de conversión consistentemente:

```typescript
// Grid → Tile
row = gridSize - 1 - z;
column = x;

// Tile → Grid
x = column;
z = gridSize - 1 - row;
```

### Error: "Estado de Zustand no actualizado inmediatamente"

**Causa**: Los hooks de React no reflejan cambios de Zustand hasta el siguiente render.

**Solución**: Calcular valores derivados localmente en lugar de depender del estado del hook:

```typescript
// MAL: Depender del hook
puzzleStore.placePiece(id);
// puzzleStore.placedPieces aún no tiene la pieza

// BIEN: Calcular localmente
const patternPiece = puzzleStore.pattern.find(p => p.id === id);
patternPiece.cells.forEach(...); // Usar directamente
```

### Error: "Stutters o congelaciones de 0.4-1s durante el juego"

**Causa**: El `useEffect` del tick loop tiene demasiadas dependencias y se re-crea constantemente.

**Solución**: Usar refs para valores que cambian frecuentemente:

```typescript
// MAL: Muchas dependencias causan re-creación del loop
useEffect(() => { ... }, [
  activePosition, activeShape, grid, lockedPieces, // ❌ Cambian frecuentemente
]);

// BIEN: Usar refs y solo dependencias estables
const activePositionRef = useRef(activePosition);
useEffect(() => { activePositionRef.current = activePosition; }, [activePosition]);

useEffect(() => {
  const tick = () => {
    const pos = activePositionRef.current; // ✅ Lee del ref
  };
}, [size, cycleTime]); // ✅ Solo valores estables
```

Ver sección 12 para más optimizaciones de rendimiento.

### Error: "Bloques fantasma invisibles que aparecen al colocar otra pieza"

**Causa**: Desincronización entre el grid lógico y `visualBlocks`. Cuando un bloque se mueve hacia abajo después de eliminar una línea, solo se marca la posición ANTIGUA en `processedPositions`, causando que se cree un bloque duplicado en la posición NUEVA.

**Solución**: En `setVisualBlocks`, después de procesar un bloque que se mueve, marcar **ambas posiciones** (antigua y nueva):

```typescript
// Paso 2: Procesar bloques que deben moverse
blocksToMove.forEach((m) => {
  // ... crear bloque movido ...
  processedPositions.add(oldPosKey);
  // FIX: Marcar también la posición NUEVA para evitar duplicados
  const newPosKey = `${m.x},${newY},${m.z}`;
  processedPositions.add(newPosKey);
});
```

### Error: "Solo se elimina una dirección de líneas (horizontal O vertical)"

**Causa**: En `applyLineClearToGrid`, se ejecutaba `shiftColumnDown()` inmediatamente después de detectar cada línea, modificando el grid antes de verificar las otras líneas.

**Solución**: Detectar TODAS las líneas completas (X y Z) ANTES de modificar el grid, usando un `Set` para recopilar columnas:

```typescript
// Set para recopilar columnas (evita duplicados en intersecciones)
const columnsToShift = new Set<string>();

// Fase 1: Detectar líneas Z completas
for (let x = 0; x < size; x++) { /* ... */ columnsToShift.add(`${x},${z}`); }

// Fase 2: Detectar líneas X completas
for (let z = 0; z < size; z++) { /* ... */ columnsToShift.add(`${x},${z}`); }

// Fase 3: Aplicar shifts DESPUÉS de detectar todas las líneas
columnsToShift.forEach((key) => {
  const [x, z] = key.split(",").map(Number);
  shiftColumnDown(x, z, level);
});
```

---

## 12. Optimizaciones de Rendimiento

El juego implementa varias optimizaciones para mantener 60+ FPS sin stutters.

### 12.1 Tick Loop con Refs

El loop principal usa `useRef` para valores que cambian frecuentemente, evitando que el `useEffect` se re-cree constantemente:

```typescript
// Refs para valores frecuentes (no causan re-render)
const activePositionRef = useRef(activePosition);
const activeShapeRef = useRef(activeShape);
const gridRef = useRef(grid);
// ... más refs

// Sincronizar refs con estado
useEffect(() => {
  activePositionRef.current = activePosition;
}, [activePosition]);

// El tick solo depende de valores ESTABLES
useEffect(() => {
  const tick = () => {
    // Usar refs en lugar de estado directo
    const currentPosition = activePositionRef.current;
    const currentShape = activeShapeRef.current;
    // ...
  };
}, [size, cycleTime, puzzleImageUrl]); // Solo 3 dependencias
```

**Beneficio**: El loop no se re-crea en cada movimiento de pieza.

### 12.2 Selectores de Zustand

En lugar de suscribirse a todo el store, se usan selectores específicos:

```typescript
// MAL: Suscribe a TODO el store (re-render en cualquier cambio)
const puzzleStore = usePuzzleStore();

// BIEN: Selectores específicos (re-render solo cuando cambia ESE valor)
const currentPuzzlePiece = usePuzzleStore((state) => state.currentPuzzlePiece);
const pattern = usePuzzleStore((state) => state.pattern);
const placedPieces = usePuzzleStore((state) => state.placedPieces);

// Actions sin suscripción
const puzzleActions = usePuzzleStore.getState();
puzzleActions.placePiece(id); // No causa re-render
```

### 12.3 Componentes Memoizados

Los componentes de renderizado están envueltos con `React.memo`:

```typescript
// Componentes memoizados:
const AnimatedCube = memo(function AnimatedCube({ ... }) { ... });
const AnimatedPuzzleCube = memo(function AnimatedPuzzleCube({ ... }) { ... });
const ActiveCube = memo(function ActiveCube({ ... }) { ... });
const GridPlane = memo(function GridPlane({ ... }) { ... });
export const PuzzleTileCube = memo(function PuzzleTileCube({ ... }) { ... });
```

**Beneficio**: Evita re-renders cuando las props no cambian.

### 12.4 Caché de Materiales (PuzzleTileCube)

Los `ShaderMaterial` se cachean globalmente para evitar crear nuevos en cada render:

```typescript
// Cache global por (gridSize, tileX, tileZ)
const tileMaterialCache = new Map<string, THREE.ShaderMaterial>();

function getCachedTileMaterial(texture, gridSize, tileX, tileZ) {
  const key = `${gridSize}-${tileX}-${tileZ}`;
  let material = tileMaterialCache.get(key);

  if (!material) {
    material = new THREE.ShaderMaterial({ ... });
    tileMaterialCache.set(key, material);
  } else {
    // Actualizar textura si cambió
    material.uniforms.u_texture.value = texture;
  }

  return material;
}
```

### 12.5 Pre-cálculo de Maps

El `placedPuzzleCellsMap` se pre-calcula con `useMemo` cuando cambia `placedPieces`:

```typescript
// Se calcula UNA vez cuando cambia placedPieces
const placedPuzzleCellsMap = useMemo(() => {
  const map = new Map<string, { tileX: number; tileZ: number }>();
  placedPieces.forEach((piece) => {
    piece.cells.forEach((cell) => {
      map.set(`${cell.x},${cell.z}`, { tileX: cell.x, tileZ: cell.z });
    });
  });
  return map;
}, [placedPieces]);
```

**Beneficio**: Evita O(n²) en lookups dentro del tick.

### 12.6 Object Pooling (Vector3)

Los componentes de animación reutilizan `Vector3` en lugar de crear nuevos cada frame:

```typescript
// En AnimatedCube
const tempVectorRef = useRef(new THREE.Vector3());

useFrame(() => {
  // Reutilizar en lugar de: new THREE.Vector3(x, y, z)
  tempVectorRef.current.set(targetX, targetY, targetZ);
  positionRef.current.lerp(tempVectorRef.current, 0.22);
});
```

### 12.7 Geometrías Compartidas

Una sola geometría se comparte entre todos los cubos:

```typescript
// Global - una sola instancia
const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

// En cada componente
<mesh geometry={SHARED_BOX_GEOMETRY} material={...} />
```

---

## Apéndice: Diagrama de Flujo Completo

```
                    ┌─────────────────┐
                    │   Iniciar Juego │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Generar Patrón  │
                    │ (puzzleGenerator)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Estado: waiting │◄──────────────────┐
                    └────────┬────────┘                   │
                             │ (usuario inicia)           │
                    ┌────────▼────────┐                   │
                    │ Estado: playing │                   │
                    └────────┬────────┘                   │
                             │                            │
              ┌──────────────┴──────────────┐             │
              │                             │             │
     ┌────────▼────────┐           ┌────────▼────────┐    │
     │ Spawn Pieza     │           │ Input Teclado   │    │
     │ Puzzle/Normal   │           │ (mover/rotar)   │    │
     └────────┬────────┘           └────────┬────────┘    │
              │                             │             │
              └──────────────┬──────────────┘             │
                             │                            │
                    ┌────────▼────────┐                   │
                    │   Tick Loop     │                   │
                    │ (bajar pieza)   │                   │
                    └────────┬────────┘                   │
                             │                            │
                    ┌────────▼────────┐                   │
                    │  ¿Colisión?     │                   │
                    └────────┬────────┘                   │
                        Sí   │   No                       │
              ┌──────────────┴───────────┐                │
              │                          │                │
     ┌────────▼────────┐        ┌────────▼────────┐       │
     │ Fijar Pieza     │        │ Mover Abajo     │       │
     └────────┬────────┘        └─────────────────┘       │
              │                                           │
     ┌────────▼────────┐                                  │
     │ ¿Pieza Puzzle?  │                                  │
     └────────┬────────┘                                  │
         Sí   │   No                                      │
     ┌────────┴────────┐                                  │
     │                 │                                  │
┌────▼─────┐    ┌──────▼──────┐                           │
│ Validar  │    │ Añadir como │                           │
│ Posición │    │ bloque normal│                          │
└────┬─────┘    └──────┬──────┘                           │
     │                 │                                  │
┌────▼─────┐           │                                  │
│ ¿Válida? │           │                                  │
└────┬─────┘           │                                  │
 Sí  │  No             │                                  │
┌────┴────┐            │                                  │
│         │            │                                  │
▼         ▼            │                                  │
Bloquear  Degradar     │                                  │
Pieza     a Normal     │                                  │
│         │            │                                  │
└────┬────┴────────────┘                                  │
     │                                                    │
┌────▼────────────────┐                                   │
│ Detectar/Limpiar    │                                   │
│ Líneas Completas    │                                   │
└────┬────────────────┘                                   │
     │                                                    │
┌────▼────────────────┐                                   │
│ ¿Todas las piezas   │                                   │
│ puzzle colocadas?   │                                   │
└────┬────────────────┘                                   │
 Sí  │  No                                                │
     │  │                                                 │
┌────▼──┐  ┌────▼─────┐                                   │
│Victory│  │¿Límite   │                                   │
│       │  │ superior?│                                   │
└───┬───┘  └────┬─────┘                                   │
    │       Sí  │  No                                     │
    │      ┌────┴────┐                                    │
    │      │         │                                    │
    │  ┌───▼───┐ ┌───▼────┐                               │
    │  │Gameover│ │Siguiente│──────────────────────────────┘
    │  └───┬───┘ │ Pieza  │
    │      │     └────────┘
    └──────┼───────────────────────────────────────────────┐
           │                                               │
           │                     (Restart)                 │
           └───────────────────────────────────────────────┘
```

---

## Contacto y Mantenimiento

Antes de modificar código relacionado con:

- Coordenadas o posiciones
- Orientación de tiles
- Limpieza de líneas
- Estado del puzzle

**Consulta** esta guía y `PUZZLE_ORIENTATION_GUIDE.md` para entender el sistema de coordenadas y mapeos.
