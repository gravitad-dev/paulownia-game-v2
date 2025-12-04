# Guía Completa de Desarrollo del Juego Puzzle-Tetris 3D

## Tabla de Contenidos

1. [Introducción y Visión General](#1-introducción-y-visión-general)
2. [Sistema de Coordenadas y Orientación](#2-sistema-de-coordenadas-y-orientación)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Componente Game.tsx](#4-componente-gametsx)
5. [Sistema de Piezas Puzzle](#5-sistema-de-piezas-puzzle)
6. [Sistema de Limpieza de Líneas](#6-sistema-de-limpieza-de-líneas)
7. [Flujo del Juego](#7-flujo-del-juego)
8. [Estados del Juego](#8-estados-del-juego)
9. [Stores (Zustand)](#9-stores-zustand)
10. [Sistema de Dificultades y Puntuación](#10-sistema-de-dificultades-y-puntuación)
11. [Componentes Principales](#11-componentes-principales)
12. [Guía de Modificaciones](#12-guía-de-modificaciones)
13. [Errores Comunes y Soluciones](#13-errores-comunes-y-soluciones)
14. [Optimizaciones de Rendimiento](#14-optimizaciones-de-rendimiento)
15. [Apéndices](#15-apéndices)

---

## 1. Introducción y Visión General

Este es un juego híbrido que combina **Tetris 3D** con un **Puzzle de imagen**. El objetivo es colocar piezas de Tetris en sus posiciones correctas para reconstruir una imagen dividida en tiles.

### Características Principales

- **Grid 3D**: Las piezas caen en un espacio tridimensional
- **Piezas Puzzle**: Cada pieza tiene tiles de imagen asignados que deben coincidir con el patrón
- **Sistema de Bloqueo**: Las piezas puzzle colocadas correctamente se bloquean y no pueden ser eliminadas
- **Limpieza de Líneas**: Similar a Tetris, pero protegiendo las piezas puzzle bloqueadas
- **Sistema de Tiempo**: Cuenta atrás con límite de tiempo según la dificultad
- **Poder NOVA**: Función especial para limpiar bloques (tecla E) con cargas limitadas
- **Sistema de Puntuación**: Puntuación basada en dificultad, líneas eliminadas y bonus de tiempo
- **Sistema de Ciclos**: Alternancia entre piezas puzzle y normales según la dificultad

### Dificultades

| Dificultad | Label      | Tamaño Grid | Ratio Puzzle:Normal | Cargas NOVA | Tiempo Límite | Puntuación Base | Indicador Visual |
| ---------- | ---------- | ----------- | ------------------- | ----------- | ------------- | --------------- | ---------------- |
| easy       | Aprendiz   | 6x6x6       | 3:1                 | 5           | 10 min        | 100             | Sí               |
| easy2      | Novato     | 6x6x6       | 2:1                 | 4           | 8 min         | 200             | Sí               |
| medium     | Aventurero | 8x8x8       | 1:1                 | 4           | 9 min         | 350             | Sí               |
| medium2    | Veterano   | 8x8x8       | 1:[1-2]             | 4           | 8 min         | 500             | Sí               |
| hard       | Maestro    | 10x10x10    | 1:2                 | 4           | 7 min         | 750             | Sí               |
| hard2      | Leyenda    | 10x10x10    | 1:3                 | 3           | 6 min         | 1000            | No               |

**Nota**: El ratio `1:[1-2]` significa que después de cada pieza puzzle, caen entre 1 y 2 piezas normales (aleatorio).

---

## 2. Sistema de Coordenadas y Orientación

### 2.1 Espacio 3D de Three.js

```
        Y (arriba - altura)
        │
        │
        │_______ X (derecha)
       /
      /
     Z (hacia la cámara)
```

- **X**: Eje horizontal (izquierda → derecha)
- **Y**: Eje vertical (abajo → arriba)
- **Z**: Eje de profundidad (lejos → cerca de la cámara)

### 2.2 Grid del Juego

```
Grid[x][y][z]:
- x: 0 a size-1 (columnas, izquierda → derecha)
- y: 0 a size-1 (altura, abajo → arriba)
- z: 0 a size-1 (profundidad, lejos → cerca)
```

### 2.3 Mapeo Imagen → Grid → Mundo

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

### 2.4 Posición Mundial de Celdas

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

### 2.5 Sistema de Orientación de Tiles

Cada tile tiene 4 esquinas numeradas en sentido horario:

```
┌─────────┐
│ 1     2 │  ← Parte SUPERIOR de la imagen
│         │
│ 4     3 │  ← Parte INFERIOR de la imagen
└─────────┘
```

La orientación `[1, 2, 3, 4]` significa:

- Esquina superior izquierda = 1
- Esquina superior derecha = 2
- Esquina inferior derecha = 3
- Esquina inferior izquierda = 4

Esta es la orientación **BASE** (sin rotar, imagen hacia abajo ⬇️).

#### Rotaciones

Si el tile se rota 90° en sentido horario:

```
Rotación 0° [1,2,3,4]:    Rotación 90° [4,1,2,3]:
┌─────────┐               ┌─────────┐
│ 1     2 │               │ 4     1 │
│         │               │         │
│ 4     3 │               │ 3     2 │
└─────────┘               └─────────┘

Rotación 180° [3,4,1,2]:  Rotación 270° [2,3,4,1]:
┌─────────┐               ┌─────────┐
│ 3     4 │               │ 2     3 │
│         │               │         │
│ 2     1 │               │ 1     4 │
└─────────┘               └─────────┘
```

**Regla CRUCIAL**: **TODOS los tiles del puzzle DEBEN tener orientación `[1, 2, 3, 4]`.**

Si algún tile tiene una orientación diferente, la imagen no se verá correctamente. El sistema valida esto automáticamente y muestra errores en consola si detecta tiles con orientación incorrecta.

### 2.6 Sistema de Coordenadas UV (Texturas)

#### Convención OpenGL/Three.js

```
V = 1.0 ┌─────────────────┐
        │ Parte SUPERIOR  │
        │ de la imagen    │
        │                 │
        │ Parte INFERIOR  │
V = 0.0 └─────────────────┘
        U=0.0           U=1.0
```

**IMPORTANTE**: En OpenGL/Three.js:

- `V = 0` es la parte **INFERIOR** de la imagen
- `V = 1` es la parte **SUPERIOR** de la imagen

#### Cálculo de UV para Tiles

Para un tile en `(tileX, tileZ)` de un grid de tamaño `gridSize`:

```glsl
float tileSize = 1.0 / gridSize;

// tileZ se INVIERTE porque row=0 debe mapear a V alto (parte superior)
float invertedZ = gridSize - 1.0 - tileZ;

vec2 uv = vec2(
  tileX * tileSize + localUV.x * tileSize,      // U normal
  invertedZ * tileSize + localUV.y * tileSize   // V invertido
);
```

#### Por qué se invierte tileZ

| Tile Position              | Sin invertir              | Con invertir              |
| -------------------------- | ------------------------- | ------------------------- |
| `tileZ = 0` (row 0, techo) | V ≈ 0 (parte inferior) ❌ | V ≈ 1 (parte superior) ✅ |
| `tileZ = 5` (row 5, base)  | V ≈ 1 (parte superior) ❌ | V ≈ 0 (parte inferior) ✅ |

### 2.7 Resumen de Inversiones

| Componente              | Qué se invierte | Fórmula                            |
| ----------------------- | --------------- | ---------------------------------- |
| `createTileGrid`        | row → Z         | `z = gridSize - 1 - row`           |
| `getTileByGridPosition` | Z → row         | `row = gridSize - 1 - z`           |
| `PuzzleTileCube` shader | tileZ → UV.v    | `invertedZ = gridSize - 1 - tileZ` |

---

## 3. Arquitectura del Sistema

### 3.1 Estructura de Directorios

```
src/
├── lib/game/                    # Lógica del juego (sin React)
│   ├── puzzleGenerator.ts       # Genera piezas puzzle con tiles asignados
│   ├── puzzleTile.ts            # Sistema de tiles y orientaciones
│   ├── puzzleValidation.ts      # Validación de colocación de piezas
│   ├── difficultyConfig.ts     # Configuración de dificultades y puntuación
│   └── three/
│       ├── grid3d.ts            # Tipos y funciones del grid 3D
│       └── tetrominoes.ts       # Definiciones de formas de Tetrominos
│
├── components/game/
│   ├── Game.tsx                 # Componente principal del juego
│   ├── PuzzleFloor.tsx          # Renderiza la imagen en el suelo
│   ├── PuzzleTileCube.tsx       # Renderiza cubos con textura de tile
│   ├── NextPiecePreview.tsx     # Preview de la siguiente pieza
│   ├── MobileControls.tsx        # Controles para dispositivos móviles
│   ├── CameraConfigPanel.tsx    # Panel de configuración de cámara
│   └── FpsCounter.tsx           # Contador de FPS
│
└── store/
    ├── usePuzzleStore.ts        # Estado del puzzle (piezas, tiles)
    ├── useCameraConfigStore.ts  # Configuración de cámara
    ├── useGameSpeedStore.ts     # Velocidad del juego
    ├── useGameSessionStore.ts   # Sesión de juego (para backend)
    ├── useGameLogStore.ts       # Logs de depuración
    └── useAudioStore.ts         # Sistema de audio
```

### 3.2 Flujo de Datos

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
              ├── Sistema de tiempo y puntuación
              ├── Poder NOVA (limpieza especial)
              └── Renderiza escena 3D
```

---

## 4. Componente Game.tsx

### 4.1 Responsabilidades Principales

El componente `Game.tsx` es el núcleo del juego y maneja:

- **Renderizado 3D**: Escena completa con React Three Fiber
- **Loop del Juego**: Tick automático para caída de piezas
- **Input de Usuario**: Teclado y controles móviles
- **Lógica de Colisiones**: Detección y manejo de colisiones
- **Validación de Piezas Puzzle**: Verificación de colocación correcta
- **Limpieza de Líneas**: Detección y eliminación de líneas completas
- **Estados del Juego**: Transiciones entre waiting, playing, gameover, victory
- **Sistema de Tiempo**: Cuenta atrás con límite
- **Poder NOVA**: Limpieza especial de bloques
- **Sistema de Puntuación**: Cálculo y visualización de puntos
- **Integración con Backend**: Envío de resultados al servidor

### 4.2 Props y Tipos

```typescript
interface GameProps {
  levelDifficulty: LevelDifficulty; // Dificultad del nivel
  puzzleImageUrl?: string; // URL de la imagen del puzzle (opcional)
  levelUuid?: string; // UUID del nivel (para backend)
}
```

### 4.3 Estados Internos Clave

```typescript
// Estados del juego
const [gameState, setGameState] = useState<GameState>(
  "waiting" | "playing" | "gameover" | "victory"
);
const [isGameOver, setIsGameOver] = useState(false);

// Grid y pieza activa
const [grid, setGrid] = useState<Grid3D>(createEmptyGrid(size));
const [activeType, setActiveType] = useState<TetrominoType>("I");
const [activeRotation, setActiveRotation] = useState(0);
const [activePosition, setActivePosition] = useState({ x, y, z });

// Sistema de bloques visuales
const [visualBlocks, setVisualBlocks] = useState<VisualBlock[]>([]);
const [isFastForward, setIsFastForward] = useState(false);

// Sistema de tiempo y puntuación
const [timeRemaining, setTimeRemaining] = useState(
  difficultyConfig.timeLimitSeconds
);
const [totalLinesCleared, setTotalLinesCleared] = useState(0);
const [finalScore, setFinalScore] = useState<GameScore | null>(null);

// Sistema de ciclos puzzle/normal
const [cyclePosition, setCyclePosition] = useState(0);
const [currentNormalTarget, setCurrentNormalTarget] = useState(
  getNormalPiecesCount(levelDifficulty)
);
const [consecutiveNormalCount, setConsecutiveNormalCount] = useState(0);

// Piezas bloqueadas y poder NOVA
const [lockedPieces, setLockedPieces] = useState<Set<string>>(new Set());
const [clearUsesRemaining, setClearUsesRemaining] = useState(
  difficultyConfig.clearCharges
);

// Preview de siguiente pieza
const [nextPiece, setNextPiece] = useState<{
  type: TetrominoType;
  rotation: number;
  isPuzzle: boolean;
  puzzleCells?: Array<{ x: number; z: number }>;
} | null>(null);

// Cámara y UI
const [cameraViewIndex, setCameraViewIndex] = useState<0 | 1 | 2 | 3>(0);
const [isFullscreen, setIsFullscreen] = useState(false);

// Backend
const [isSendingResults, setIsSendingResults] = useState(false);
const [backendError, setBackendError] = useState<string | null>(null);
const [backendResults, setBackendResults] = useState<{
  score;
  duration;
  levelStatus;
} | null>(null);
```

### 4.4 Refs para Optimización

El componente usa refs extensivamente para evitar re-crear el `useEffect` del tick loop:

```typescript
// Refs para valores que cambian frecuentemente
const activePositionRef = useRef(activePosition);
const activeShapeRef = useRef(activeShape);
const activeWorldBlocksRef = useRef(activeWorldBlocks);
const gridRef = useRef(grid);
const lockedPiecesRef = useRef(lockedPieces);
const currentPuzzlePieceRef = useRef(currentPuzzlePiece);
const patternRef = useRef(pattern);
const placedPiecesRef = useRef(placedPieces);
const remainingPiecesRef = useRef(remainingPieces);
const timeRemainingRef = useRef(timeRemaining);
const totalLinesClearedRef = useRef(totalLinesCleared);
// ... más refs

// Sincronización en un solo useEffect consolidado
useEffect(() => {
  activePositionRef.current = activePosition;
  activeShapeRef.current = activeShape;
  // ... sincronizar todos los refs
}, [activePosition, activeShape /* ... todas las dependencias */]);
```

### 4.5 Componentes Internos

#### AnimatedCube

Renderiza un cubo normal con animación de posición y escala. Usa `useFrame` para interpolar suavemente hacia la posición objetivo.

```typescript
const AnimatedCube = memo(function AnimatedCube({
  block,
  halfSize,
  onDestroyed,
}: AnimatedCubeProps) {
  // Usa refs para Vector3 reutilizables (object pooling)
  const tempVectorRef = useRef(new THREE.Vector3());
  const positionRef = useRef(new THREE.Vector3(...));
  const scaleRef = useRef(block.scale);

  useFrame(() => {
    // Interpolación suave hacia target
    positionRef.current.lerp(tempVectorRef.current, 0.22);
    scaleRef.current = lerp(scaleRef.current, block.targetScale, 0.15);
  });

  // Renderiza con material cacheado
});
```

#### AnimatedPuzzleCube

Similar a `AnimatedCube` pero renderiza un cubo con textura de tile del puzzle usando `PuzzleTileCube`.

```typescript
const AnimatedPuzzleCube = memo(function AnimatedPuzzleCube({
  block,
  halfSize,
  onDestroyed,
  imageUrl,
  gridSize,
}: AnimatedPuzzleCubeProps) {
  // Misma lógica de animación que AnimatedCube
  // Pero renderiza PuzzleTileCube en lugar de cubo normal
});
```

#### ActiveCube

Renderiza la pieza activa (la que está cayendo). Usa un material especial con bordes blancos.

```typescript
const ActiveCube = memo(function ActiveCube({
  position,
  variantParams,
}: ActiveCubeProps) {
  // Material con textura porous.jpg y colores blancos
  // Renderiza en la posición exacta de la pieza activa
});
```

#### GridPlane

Renderiza una superficie del grid con líneas. Se usa para el suelo y las paredes.

```typescript
const GridPlane = memo(function GridPlane({
  width,
  height,
  segments,
  position,
  rotation,
  color,
  visible,
}: GridPlaneProps) {
  // Geometría cacheada por tamaño
  // Material cacheado por color
  // Renderiza líneas del grid
});
```

#### LightingRig

Configura la iluminación de la escena 3D.

```typescript
const LightingRig = memo(function LightingRig() {
  return (
    <>
      <color attach="background" args={["#1a1b26"]} />
      <ambientLight color="#ffffff" intensity={0.5} />
      <directionalLight
        color="#ffffff"
        intensity={0.8}
        position={[10, 15, 10]}
      />
    </>
  );
});
```

### 4.6 Loop Principal (Tick)

El tick loop se ejecuta con `requestAnimationFrame` y usa refs para evitar dependencias excesivas:

```typescript
useEffect(() => {
  if (isGameOver || gameState !== "playing") return;

  let animationFrameId: number;

  const tick = () => {
    const now = performance.now();
    const factor = isFastForwardRef.current ? FAST_FORWARD_FACTOR : 1;
    const effectiveCycleTime = cycleTime * factor;

    if (now - lastTickTimeRef.current >= effectiveCycleTime) {
      lastTickTimeRef.current = now;

      // Usar refs en lugar de estado directo
      const currentPosition = activePositionRef.current;
      const currentShape = activeShapeRef.current;
      const currentGrid = gridRef.current;

      // Calcular siguiente posición (bajar en Y)
      const nextPosition = {
        x: currentPosition.x,
        y: currentPosition.y - 1,
        z: currentPosition.z,
      };

      // Verificar colisión
      const nextBlocks = currentShape.map((cell) => ({
        x: nextPosition.x + cell.x,
        y: nextPosition.y + cell.y,
        z: nextPosition.z + cell.z,
      }));

      const hasCollision = nextBlocks.some((block) => {
        if (!isInsideBounds(block.x, block.y, block.z)) return true;
        return currentGrid[block.x][block.y][block.z] === "filled";
      });

      if (hasCollision) {
        // Fijar pieza y procesar líneas
        lockPiece();
      } else {
        // Mover hacia abajo
        setActivePosition(nextPosition);
      }
    }

    animationFrameId = requestAnimationFrame(tick);
  };

  animationFrameId = requestAnimationFrame(tick);

  return () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  };
}, [
  size,
  cycleTime,
  puzzleImageUrl,
  isGameOver,
  gameState /* solo dependencias estables */,
]);
```

### 4.7 Manejo de Input

#### Teclado

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (gameState !== "playing") return;

    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        tryMove(-1, 0, 0); // Mover izquierda
        break;
      case "ArrowRight":
      case "d":
      case "D":
        tryMove(1, 0, 0); // Mover derecha
        break;
      case "ArrowDown":
      case "s":
      case "S":
        tryMove(0, -1, 0); // Mover abajo
        break;
      case "ArrowUp":
      case "w":
      case "W":
        tryMove(0, 0, -1); // Mover adelante (Z negativo)
        break;
      case " ":
        tryMove(0, 0, 1); // Mover atrás (Z positivo)
        break;
      case "q":
      case "Q":
        tryRotate(-1); // Rotar izquierda
        break;
      case "e":
      case "E":
        if (clearUsesRemaining > 0) {
          clearAboveFloor(); // Poder NOVA
        }
        break;
      case "r":
      case "R":
        tryRotate(1); // Rotar derecha
        break;
      case "Shift":
        setIsFastForward(true); // Caída rápida
        break;
      case "c":
      case "C":
        rotateCameraView("right"); // Rotar cámara
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [gameState /* ... */]);
```

#### Controles Móviles

El componente `MobileControls` maneja gestos táctiles y botones virtuales para dispositivos móviles.

### 4.8 Sistema de Renderizado 3D

El renderizado se estructura así:

```typescript
<Canvas camera={{ /* configuración */ }}>
  <CameraShakeController /> {/* Efecto de shake */}
  <LightingRig /> {/* Iluminación */}

  <group>
    {/* Suelo - PuzzleFloor o GridPlane */}
    {puzzleImageUrl ? (
      <PuzzleFloor imageUrl={puzzleImageUrl} size={size} gridSize={size} />
    ) : (
      <GridPlane /* ... */ />
    )}

    {/* Indicador de posición destino (verde) para piezas puzzle */}
    {difficultyConfig.showTargetIndicator && currentPuzzlePiece && (
      patternPiece.cells.map(cell => (
        <mesh position={[...]} material={PUZZLE_TARGET_MATERIAL}>
          <planeGeometry args={[0.95, 0.95]} />
        </mesh>
      ))
    )}

    {/* Paredes del grid (visibles según vista de cámara) */}
    <GridPlane /* Pared izquierda */ />
    <GridPlane /* Pared trasera */ />
    <GridPlane /* Pared derecha */ />
    <GridPlane /* Pared frontal */ />

    {/* Pieza activa - cubos de la pieza actual */}
    {activeWorldBlocks.map((block, index) => {
      if (currentPuzzlePiece && puzzleImageUrl && isCorrectOrientation) {
        return <PuzzleTileCube /* ... */ />;
      }
      return <ActiveCube /* ... */ />;
    })}

    {/* Preview de caída (ghost) - cubos amarillos transparentes */}
    {dropPositionBlocks.map(block => (
      <mesh material={GHOST_MATERIAL} geometry={SHARED_BOX_GEOMETRY} />
    ))}

    {/* Piezas apiladas - AnimatedCube o AnimatedPuzzleCube */}
    {visualBlocks.map(block => {
      if (block.isPuzzleBlock && puzzleImageUrl) {
        return <AnimatedPuzzleCube /* ... */ />;
      }
      return <AnimatedCube /* ... */ />;
    })}
  </group>
</Canvas>
```

### 4.9 Funciones Principales

#### lockPiece()

Fija la pieza actual en el grid y procesa la lógica de colocación:

1. Verifica si es pieza puzzle y valida colocación
2. Si es válida, bloquea la pieza y actualiza stores
3. Detecta y limpia líneas completas
4. Actualiza bloques visuales con animaciones
5. Genera nueva pieza según el ciclo
6. Verifica condiciones de victoria/derrota

#### tryMove(dx, dy, dz)

Intenta mover la pieza activa en la dirección especificada:

```typescript
const tryMove = useCallback(
  (dx: number, dy: number, dz: number) => {
    const nextPosition = {
      x: activePosition.x + dx,
      y: activePosition.y + dy,
      z: activePosition.z + dz,
    };

    const nextBlocks = activeShape.map((cell) => ({
      x: nextPosition.x + cell.x,
      y: nextPosition.y + cell.y,
      z: nextPosition.z + cell.z,
    }));

    if (!checkCollision(nextBlocks)) {
      setActivePosition(nextPosition);
    }
  },
  [activePosition, activeShape, checkCollision]
);
```

#### tryRotate(direction)

Rota la pieza activa (solo piezas normales, las puzzle no se pueden rotar):

```typescript
const tryRotate = useCallback(
  (direction: number) => {
    if (currentPuzzlePiece) return; // No rotar piezas puzzle

    const newRotation = (activeRotation + direction + 4) % 4;
    const newShape = rotateShapeHorizontal(
      TETROMINO_SHAPES[activeType],
      newRotation
    );

    const rotatedBlocks = newShape.map((cell) => ({
      x: activePosition.x + cell.x,
      y: activePosition.y + cell.y,
      z: activePosition.z + cell.z,
    }));

    if (!checkCollision(rotatedBlocks)) {
      setActiveRotation(newRotation);
    }
  },
  [
    activePosition,
    activeType,
    activeRotation,
    currentPuzzlePiece,
    checkCollision,
  ]
);
```

#### clearAboveFloor()

Poder NOVA: Limpia todos los bloques NO bloqueados en todo el espacio de juego:

```typescript
const clearAboveFloor = useCallback(() => {
  if (clearUsesRemaining <= 0) return;

  setClearUsesRemaining(prev => prev - 1);
  audioActions.playPowerClear();

  // Calcular posiciones bloqueadas
  const lockedPositions = new Set<string>();
  placedPieces.forEach(piece => {
    if (lockedPieces.has(piece.id)) {
      piece.cells.forEach(cell => {
        lockedPositions.add(`${cell.x},0,${cell.z}`);
      });
    }
  });

  // Vaciar grid excepto bloqueados
  setGrid(prevGrid => {
    const newGrid = /* ... copia del grid */;
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const posKey = `${x},${y},${z}`;
          if (!lockedPositions.has(posKey)) {
            newGrid[x][y][z] = "empty";
          }
        }
      }
    }
    return newGrid;
  });

  // Marcar bloques visuales para destrucción
  setVisualBlocks(prev => prev.map(block => {
    const posKey = `${block.targetX},${block.targetY},${block.targetZ}`;
    if (!lockedPositions.has(posKey)) {
      return { ...block, targetScale: 0, destroying: true };
    }
    return block;
  }));
}, [size, clearUsesRemaining, lockedPieces, placedPieces]);
```

#### startGame()

Inicializa el juego y genera la primera pieza:

```typescript
const startGame = useCallback(
  () => {
    gameStartTimeRef.current = Date.now();
    const normalTarget = getNormalPiecesCount(levelDifficulty);
    setCurrentNormalTarget(normalTarget);

    // Determinar si la primera pieza debe ser puzzle
    const firstShouldBePuzzle = shouldPositionBePuzzle(0, normalTarget);

    // Spawnear primera pieza
    if (puzzleImageUrl && firstShouldBePuzzle && availablePieces.length > 0) {
      const firstPuzzlePiece = availablePieces[0];
      puzzleActions.setCurrentPuzzlePiece(firstPuzzlePiece);
      setActiveType(firstPuzzlePiece.type);
      setActiveRotation(firstPuzzlePiece.rotation);
      setActivePosition(spawnPosition);
    }

    // Inicializar preview de siguiente pieza
    // ...

    setGameState("playing");
    lastTickTimeRef.current = performance.now();
  },
  [
    /* ... */
  ]
);
```

#### sendResultsToBackend(status, bonusPoints?)

Envía los resultados del juego al backend:

```typescript
const sendResultsToBackend = useCallback(
  async (status: "won" | "lost" | "abandoned", bonusPoints?: number) => {
    if (!gameSession?.hash || !levelUuid) return;

    setIsSendingResults(true);
    setBackendError(null);
    setEnding();

    try {
      const results = await GameService.endGame({
        levelUuid,
        difficulty: levelDifficulty,
        hash: gameSession.hash,
        status,
        bonusPoints,
      });

      setBackendResults({
        score: results.score,
        duration: results.duration,
        levelStatus: results.levelStatus,
      });

      setResults({
        /* ... */
      });
    } catch (error) {
      setBackendError(errorMessage);
      setSessionError(errorMessage);
    } finally {
      setIsSendingResults(false);
    }
  },
  [
    /* ... */
  ]
);
```

### 4.10 Integración con Stores

El componente usa selectores específicos de Zustand para optimizar re-renders:

```typescript
// Selectores específicos (recomendado)
const currentPuzzlePiece = usePuzzleStore((state) => state.currentPuzzlePiece);
const pattern = usePuzzleStore((state) => state.pattern);
const remainingPieces = usePuzzleStore((state) => state.remainingPieces);
const placedPieces = usePuzzleStore((state) => state.placedPieces);

// Actions sin suscripción
const puzzleActions = usePuzzleStore.getState();
puzzleActions.placePiece(id); // No causa re-render
```

Otros stores:

```typescript
const cameraConfig = useCameraConfigStore((state) => state.config);
const cycleTime = useGameSpeedStore((state) => state.cycleTime);
const gameSession = useGameSessionStore(gameSessionSelectors.session);
const isMuted = useAudioStore((state) => state.isMuted);
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
  activeBlocks: { x: number; y: number; z: number }[],
  patternPiece: PuzzlePiece
): PlacementValidation {
  // 1. Todos los bloques deben estar en Y=0
  const allAtY0 = activeBlocks.every((block) => block.y === 0);
  if (!allAtY0) {
    return { isValid: false, reason: "Not all blocks at Y=0" };
  }

  // 2. Las coordenadas X,Z deben coincidir con el patrón
  const patternCells = new Set(patternPiece.cells.map((c) => `${c.x},${c.z}`));
  const activeCells = new Set(activeBlocks.map((b) => `${b.x},${b.z}`));

  if (patternCells.size !== activeCells.size) {
    return { isValid: false, reason: "Cell count mismatch" };
  }

  for (const cell of patternCells) {
    if (!activeCells.has(cell)) {
      return { isValid: false, reason: "Cell position mismatch" };
    }
  }

  // 3. Los tiles deben estar conectados (validado en puzzleGenerator)
  // 4. Los tiles deben tener orientación base [1,2,3,4] (validado en puzzleGenerator)

  return { isValid: true };
}
```

---

## 6. Sistema de Limpieza de Líneas

### 6.1 Conceptos Clave

- **Línea completa**: Todos los bloques en una fila X o Z en un nivel Y están "filled"
- **Posiciones bloqueadas**: Celdas de piezas puzzle correctamente colocadas (solo en Y=0)
- **Comportamiento**: Las líneas completas se eliminan, EXCEPTO las posiciones bloqueadas
- **Cascadas**: Después de eliminar líneas, se detectan nuevas líneas completas y se repite el proceso

### 6.2 Flujo de Limpieza

```
1. detectLineClears(grid, level, lockedPositions)
   - Detecta líneas completas en X y Z
   - Retorna bloques a eliminar (excluyendo bloqueados)
   - Retorna bloques a mover (desplazamiento hacia abajo)

2. applyLineClearToGrid(grid, level, lockedPositions)
   - Fase 1: Detectar TODAS las líneas completas (Z y X) SIN modificar el grid
   - Fase 2: Recopilar columnas a desplazar en un Set<string> (evita duplicados)
   - Fase 3: Aplicar shiftColumnDown a todas las columnas en bloque
   - El while loop repite hasta que no haya más líneas (cascadas)

3. processLineClearsIteratively(grid, lockedPositions)
   - Repite el proceso en todos los niveles Y (0 a MAX_STACK_HEIGHT)
   - Retorna grid final y bloques eliminados/movidos
```

**IMPORTANTE**: La detección de líneas X y Z se hace **antes** de modificar el grid. Esto garantiza que cuando se completan líneas en ambas direcciones (cruz o L), se eliminan todas simultáneamente en lugar de solo una.

### 6.3 Cálculo de lockedPositions

```typescript
// lockedPositions es un Set<string> con formato "x,z" (solo para Y=0)
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

### 6.4 Protección de Bloques Bloqueados

- **Solo en Y=0**: Los bloques bloqueados solo están protegidos en el nivel del suelo (Y=0)
- **Cuentan para líneas**: Los bloques bloqueados SÍ cuentan como "filled" para completar líneas
- **No se eliminan**: Los bloques bloqueados NO se eliminan cuando se completa una línea
- **No se mueven**: Los bloques bloqueados NO se mueven cuando se eliminan líneas superiores

---

## 7. Flujo del Juego

### 7.1 Inicialización

```
1. Game.tsx recibe difficulty y puzzleImageUrl
2. Se genera el patrón de puzzle:
   - createTileGrid(size) → matriz de tiles
   - fillGridWithTetrominos(size, seed) → piezas con celdas
   - assignTilesToPieces() → asigna tiles a cada pieza
3. Se inicializa puzzleStore con el patrón
4. Se configura el estado inicial (waiting o playing)
5. Si hay puzzleImageUrl, estado = "waiting" (espera inicio del usuario)
6. Si no hay puzzleImageUrl, estado = "playing" (modo Tetris normal)
```

### 7.2 Loop Principal (tick)

```typescript
// Ejecutado en useEffect con requestAnimationFrame
const tick = () => {
  const deltaTime = now - lastTickTime;
  const factor = isFastForward ? FAST_FORWARD_FACTOR : 1;
  const effectiveCycleTime = cycleTime * factor;

  if (deltaTime >= effectiveCycleTime) {
    // Usar refs en lugar de estado directo (evita re-crear el useEffect)
    const currentPosition = activePositionRef.current;
    const currentShape = activeShapeRef.current;

    // Intentar mover hacia abajo
    const nextPosition = { ...currentPosition, y: currentPosition.y - 1 };
    const nextBlocks = /* calcular bloques en nueva posición */;

    if (!checkCollision(nextBlocks)) {
      setActivePosition(nextPosition);
    } else {
      // Colisión: fijar pieza
      lockPiece();
    }
  }

  requestAnimationFrame(tick);
};
```

### 7.3 Colocación de Piezas

```
1. Pieza colisiona (no puede bajar más)
2. Si es pieza puzzle:
   a. Validar posición (validatePuzzlePlacement)
   b. Si válida:
      - Marcar como colocada (placePiece)
      - Añadir a lockedPieces
      - Reproducir sonido y shake
      - Verificar victoria (todas las piezas colocadas)
   c. Si inválida:
      - Se degrada a pieza normal (discardPiece)
      - Vuelve al pool de piezas disponibles
3. Añadir bloques al grid temporal
4. Calcular lockedPositions (incluyendo pieza recién colocada)
5. Detectar y limpiar líneas completas (processLineClearsIteratively)
6. Actualizar bloques visuales con animaciones
7. Generar nueva pieza según el ciclo
8. Actualizar preview de siguiente pieza
```

### 7.4 Sistema de Ciclos Puzzle/Normal

El juego alterna entre piezas puzzle y normales según la dificultad:

```typescript
// Ejemplo: dificultad "medium" tiene ratio 1:1
// Ciclo: puzzle → normal → puzzle → normal → ...

const shouldPositionBePuzzle = (pos: number, normalTarget: number): boolean => {
  const puzzleCount = getPuzzlePiecesCount(levelDifficulty);
  const cycleLength = puzzleCount + normalTarget;
  const posInCycle = pos % cycleLength;
  return posInCycle < puzzleCount;
};

// Al completar un ciclo, se genera nuevo target aleatorio (si aplica)
if (nextCyclePos % cycleLength === 0) {
  nextNormalTarget = getNormalPiecesCount(levelDifficulty);
  setCurrentNormalTarget(nextNormalTarget);
}
```

### 7.5 Sistema de Pieza de Ayuda (O1)

Cada 5 piezas normales consecutivas, se genera una pieza O1 (1x1) para ayudar:

```typescript
const NORMAL_PIECES_FOR_HELPER = 5;

// Actualizar contador
if (currentPieceWasPuzzle) {
  newConsecutiveCount = 0;
} else {
  newConsecutiveCount = currentConsecutiveCount + 1;
}

// Verificar si debe generar pieza de ayuda
if (newConsecutiveCount >= NORMAL_PIECES_FOR_HELPER) {
  setNextPiece({ type: "O1", rotation: 0, isPuzzle: false });
  setConsecutiveNormalCount(0);
}
```

---

## 8. Estados del Juego

```typescript
type GameState = "waiting" | "playing" | "gameover" | "victory";
```

| Estado     | Descripción                                | Transiciones             |
| ---------- | ------------------------------------------ | ------------------------ |
| `waiting`  | Pantalla inicial (solo con puzzleImageUrl) | → `playing`              |
| `playing`  | Juego activo                               | → `gameover` / `victory` |
| `gameover` | Perdió (pieza en límite superior o tiempo) | → `waiting` (restart)    |
| `victory`  | Ganó (todas las piezas puzzle colocadas)   | → `waiting` (restart)    |

### 8.1 Condiciones de Victoria

- Todas las piezas puzzle del patrón están colocadas correctamente
- Se calcula la puntuación final (base + líneas + bonus de tiempo)
- Se envían resultados al backend
- Se muestra pantalla de victoria con desglose de puntuación

### 8.2 Condiciones de Derrota

- **Límite de altura**: Una pieza alcanza `MAX_STACK_HEIGHT` (5)
- **Tiempo agotado**: El contador de tiempo llega a 0

En ambos casos se envía el resultado al backend con status "lost".

---

## 9. Stores (Zustand)

### 9.1 usePuzzleStore

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
  discardPiece(pieceId): void;
  setCurrentPuzzlePiece(piece): void;
  incrementPieceCounter(): void;
  reset(): void;
  getTileAt(x, z): Tile | undefined;
}
```

**Patrón de uso optimizado**:

```typescript
// Selectores específicos (recomendado)
const currentPuzzlePiece = usePuzzleStore((state) => state.currentPuzzlePiece);
const pattern = usePuzzleStore((state) => state.pattern);

// Actions sin suscripción
const puzzleActions = usePuzzleStore.getState();
puzzleActions.placePiece(id);
```

### 9.2 useCameraConfigStore

Almacena configuración de cámara (distancia, altura, offset, fov, zoom).

```typescript
interface CameraConfig {
  distanceMultiplier: number;
  heightMultiplier: number;
  offset: number;
  fov: number;
  zoom: number;
}
```

### 9.3 useGameSpeedStore

Almacena `cycleTime` (milisegundos entre movimientos). Menor valor = más rápido.

```typescript
interface GameSpeedState {
  cycleTime: number; // Milisegundos entre movimientos
  setCycleTime: (time: number) => void;
}
```

### 9.4 useGameSessionStore

Maneja la sesión de juego para integración con backend:

```typescript
interface GameSessionState {
  hash: string | null;
  seed: string | null;
  startTime: number | null;
  setStart: (hash: string, seed: string) => void;
  setEnding: () => void;
  setResults: (results: GameResults) => void;
  setError: (error: string) => void;
}
```

### 9.5 useGameLogStore

Sistema de logs para depuración:

```typescript
interface GameLogState {
  logs: GameLog[];
  errors: GameError[];
  addLog: (log: GameLog) => void;
  addError: (message: string, error: Error, context: string) => void;
  clearAll: () => void;
  printGameSummary: () => void;
}
```

### 9.6 useAudioStore

Sistema de audio:

```typescript
interface AudioState {
  isMuted: boolean;
  initialize: () => void;
  toggleMute: () => void;
  playPieceLock: () => void;
  playLineClear: () => void;
  playGameOver: () => void;
  playVictory: () => void;
  playPowerClear: () => void;
}
```

---

## 10. Sistema de Dificultades y Puntuación

### 10.1 Configuración de Dificultades

Definida en `src/lib/game/difficultyConfig.ts`:

```typescript
export interface DifficultyConfig {
  label: string;
  puzzleToNormalRatio: [number, number] | [number, [number, number]];
  clearCharges: number;
  timeLimitSeconds: number;
  baseScore: number;
  showTargetIndicator: boolean;
  badgeColor: string;
}
```

### 10.2 Sistema de Puntuación

La puntuación se calcula con tres componentes:

```typescript
interface GameScore {
  baseScore: number; // Puntuación base por dificultad
  linesClearedScore: number; // 50 puntos por cada línea eliminada
  timeBonus: number; // Bonus por terminar rápido
  totalScore: number; // Suma de todos los componentes
}
```

#### Cálculo de Bonus de Tiempo

```typescript
const timePercentage = timeUsedSeconds / timeLimitSeconds;

if (timePercentage <= 0.5) {
  timeBonus = Math.floor(baseScore * 0.5); // 50% del tiempo: +50% base
} else if (timePercentage <= 0.75) {
  timeBonus = Math.floor(baseScore * 0.25); // 75% del tiempo: +25% base
} else {
  timeBonus = 0; // Sin bonus
}
```

### 10.3 Poder NOVA

El poder NOVA (tecla E) permite limpiar todos los bloques NO bloqueados:

- **Cargas limitadas**: Depende de la dificultad (3-5 cargas)
- **Protege piezas puzzle**: Solo limpia bloques que NO son piezas puzzle bloqueadas
- **Solo en Y>0**: Las piezas puzzle bloqueadas están en Y=0 y están protegidas
- **Feedback visual**: Los bloques se animan al destruirse
- **Sonido**: Reproduce sonido especial al usar

---

## 11. Componentes Principales

### 11.1 PuzzleFloor.tsx

Renderiza la imagen completa del puzzle en el suelo (Y = -halfSize).

```typescript
<PuzzleFloor
  imageUrl={puzzleImageUrl}
  size={size} // Tamaño del plano
  gridSize={size} // Número de tiles
  position={[0, -halfSize, 0]}
/>
```

### 11.2 PuzzleTileCube.tsx

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

### 11.3 NextPiecePreview.tsx

Muestra una previsualización de la siguiente pieza que caerá. Renderiza la pieza en miniatura con su forma y rotación.

### 11.4 MobileControls.tsx

Controles táctiles para dispositivos móviles:

- Botones de movimiento (izquierda, derecha, adelante, atrás)
- Botones de rotación
- Botón de caída rápida
- Botones de rotación de cámara
- Botón de poder NOVA

### 11.5 CameraConfigPanel.tsx

Panel de configuración de cámara que permite ajustar:

- Distancia de la cámara
- Altura de la cámara
- Offset (desplazamiento)
- FOV (campo de visión)
- Zoom

---

## 12. Guía de Modificaciones

### 12.1 Añadir Nuevo Tipo de Tetromino

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

### 12.2 Modificar Velocidad del Juego

```typescript
// En useGameSpeedStore.ts
const useGameSpeedStore = create((set) => ({
  cycleTime: 1000, // Milisegundos entre movimientos (menor = más rápido)
  setCycleTime: (time) => set({ cycleTime: time }),
}));
```

### 12.3 Añadir Nueva Dificultad

1. **En `types/level.ts`**:

```typescript
type LevelDifficulty = "easy" | "medium" | "hard" | "extreme";
```

2. **En `grid3d.ts`**:

```typescript
const DIFFICULTY_TO_SIZE: Record<LevelDifficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 10,
  extreme: 12, // Nueva dificultad
};
```

3. **En `difficultyConfig.ts`**:

```typescript
export const DIFFICULTY_CONFIGS: Record<LevelDifficulty, DifficultyConfig> = {
  // ... configuraciones existentes
  extreme: {
    label: "Extremo",
    puzzleToNormalRatio: [1, 4],
    clearCharges: 2,
    timeLimitSeconds: 5 * 60,
    baseScore: 1500,
    showTargetIndicator: false,
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/40",
  },
};
```

### 12.4 Modificar Sistema de Puntuación

El sistema de puntuación está en `difficultyConfig.ts`. Para modificarlo:

1. Cambiar `baseScore` en las configuraciones de dificultad
2. Modificar `calculateScore()` para cambiar la fórmula
3. Ajustar `linesClearedScore` (actualmente 50 puntos por línea)
4. Modificar el cálculo de `timeBonus`

---

## 13. Errores Comunes y Soluciones

### Error: "Piezas puzzle desaparecen al completar línea"

**Causa**: `lockedPositions` no incluye la pieza recién colocada.

**Solución**: Calcular `lockedPositions` ANTES de llamar a `processLineClearsIteratively`, incluyendo las celdas de la pieza recién colocada.

```typescript
// CORRECTO
const lockedPositions = new Set<string>();
// ... añadir piezas ya colocadas ...
if (isPuzzleCorrectlyPlaced && currentPuzzlePiece) {
  patternPiece.cells.forEach((c) => {
    lockedPositions.add(`${c.x},${c.z}`);
  });
}
const { finalGrid } = processLineClearsIteratively(tempGrid, lockedPositions);
```

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

### Error: "Bloques fantasma invisibles que aparecen al colocar otra pieza"

**Causa**: Desincronización entre el grid lógico y `visualBlocks`. Cuando un bloque se mueve hacia abajo después de eliminar una línea, solo se marca la posición ANTIGUA en `processedPositions`, causando que se cree un bloque duplicado en la posición NUEVA.

**Solución**: En `setVisualBlocks`, después de procesar un bloque que se mueve, marcar **ambas posiciones** (antigua y nueva):

```typescript
// Paso 2: Procesar bloques que deben moverse
blocksToMove.forEach((m) => {
  // ... crear bloque movido ...
  processedPositions.add(oldPosKey);
  // FIX: Marcar también la posición NUEVA para evitar duplicados
  const newPosKey = `${m.x},${m.newY},${m.z}`;
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
for (let x = 0; x < size; x++) {
  /* ... */ columnsToShift.add(`${x},${z}`);
}

// Fase 2: Detectar líneas X completas
for (let z = 0; z < size; z++) {
  /* ... */ columnsToShift.add(`${x},${z}`);
}

// Fase 3: Aplicar shifts DESPUÉS de detectar todas las líneas
columnsToShift.forEach((key) => {
  const [x, z] = key.split(",").map(Number);
  shiftColumnDown(x, z, level);
});
```

---

## 14. Optimizaciones de Rendimiento

El juego implementa varias optimizaciones para mantener 60+ FPS sin stutters.

### 14.1 Tick Loop con Refs

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

### 14.2 Selectores de Zustand

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

### 14.3 Componentes Memoizados

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

### 14.4 Caché de Materiales (PuzzleTileCube)

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

### 14.5 Pre-cálculo de Maps

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

### 14.6 Object Pooling (Vector3)

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

### 14.7 Geometrías Compartidas

Una sola geometría se comparte entre todos los cubos:

```typescript
// Global - una sola instancia
const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

// En cada componente
<mesh geometry={SHARED_BOX_GEOMETRY} material={...} />
```

### 14.8 Pool de Estructuras Reutilizables

El componente usa un pool de estructuras reutilizables para evitar GC en el tick loop:

```typescript
const reusableDataRef = useRef({
  // Maps y Sets reutilizables
  blocksByPosition: new Map<string, VisualBlock>(),
  processedPositions: new Set<string>(),
  resultBlocks: [] as VisualBlock[],
  destroyingBlocks: [] as VisualBlock[],
  // Para puzzle cells
  newPuzzleCells: new Map<string, { tileX: number; tileZ: number }>(),
  currentPlacedPuzzleCellsMap: new Map<
    string,
    { tileX: number; tileZ: number }
  >(),
  // Pool de vectores Three.js
  tempVectors: {
    v1: new THREE.Vector3(),
    v2: new THREE.Vector3(),
    v3: new THREE.Vector3(),
  },
});
```

---

## 15. Apéndices

### 15.1 Diagrama de Flujo Completo

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
     │ ¿Pieza Puzzle? │                                  │
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

### 15.2 Referencias Rápidas

#### Fórmulas de Conversión de Coordenadas

```typescript
// Imagen → Grid
gridPosition.z = gridSize - 1 - row;
gridPosition.x = column;

// Grid → Imagen
row = gridSize - 1 - gridPosition.z;
column = gridPosition.x;

// Grid → Mundo
worldX = gridPosition.x - (gridSize - 1) / 2;
worldY = gridPosition.y - (gridSize - 1) / 2;
worldZ = gridPosition.z - (gridSize - 1) / 2;
```

#### Constantes Importantes

```typescript
const MAX_STACK_HEIGHT = 5; // Altura máxima antes de game over
const FAST_FORWARD_FACTOR = 0.1; // Factor de velocidad en caída rápida
const NORMAL_PIECES_FOR_HELPER = 5; // Piezas normales antes de pieza de ayuda
```

#### Tipos de Estados del Juego

```typescript
type GameState = "waiting" | "playing" | "gameover" | "victory";
```

#### Tipos de Tetrominos

```typescript
type TetrominoType =
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
  | "L2"
  | "O1";
```

---

## Contacto y Mantenimiento

Antes de modificar código relacionado con:

- Coordenadas o posiciones
- Orientación de tiles
- Limpieza de líneas
- Estado del puzzle
- Componente Game.tsx

**Consulta** esta guía para entender el sistema de coordenadas, mapeos, y arquitectura del juego.
