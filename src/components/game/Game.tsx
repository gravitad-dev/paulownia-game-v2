//import Scene from "./Scene";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import * as THREE from "three";
import { FiMaximize2, FiMinimize2, FiVolume2, FiVolumeX, FiArrowLeft, FiClock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createEmptyGrid,
  Grid3D,
  getGridSizeByLevelDifficulty,
} from "@/lib/game/three/grid3d";
import {
  TetrominoType,
  TETROMINO_SHAPES,
  rotateShapeHorizontal,
} from "@/lib/game/three/tetrominoes";
import { LevelDifficulty } from "@/types/level";
import {
  getDifficultyConfig,
  getDifficultyLabel,
  getNormalPiecesCount,
  getPuzzlePiecesCount,
  calculateScore,
  formatTime,
  GameScore,
} from "@/lib/game/difficultyConfig";
import { useCameraConfigStore } from "@/store/useCameraConfigStore";
import { useGameSpeedStore } from "@/store/useGameSpeedStore";
import { usePuzzleStore } from "@/store/usePuzzleStore";
import { CameraConfigPanel } from "./CameraConfigPanel";
import { FpsCounter } from "./FpsCounter";
import { PuzzleFloor } from "./PuzzleFloor";
import { PuzzleTileCube } from "./PuzzleTileCube";
import { generatePuzzlePattern } from "@/lib/game/puzzleGenerator";
import { validatePuzzlePlacement } from "@/lib/game/puzzleValidation";
import { useGameLogStore } from "@/store/useGameLogStore";
import { useAudioStore, audioActions } from "@/store/useAudioStore";
import { useCameraShake, CameraShakeController } from "@/hooks/useCameraShake";
import { NextPiecePreview } from "./NextPiecePreview";
import MobileControls from "./MobileControls";

const MAX_STACK_HEIGHT = 5;
const FAST_FORWARD_FACTOR = 0.1;

// Tipos para el sistema de bloques visuales con animación
interface BlockColors {
  topBottom: string;
  frontBack: string;
  leftRight: string;
}

interface VisualBlock {
  id: number;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  scale: number;
  targetScale: number;
  destroying: boolean;
  variantParams: CubeVariantParams;
  // Información de puzzle para bloques bloqueados
  isPuzzleBlock?: boolean;
  puzzleTileX?: number;
  puzzleTileZ?: number;
}

let blockIdCounter = 0;
const generateBlockId = () => ++blockIdCounter;

// Componente de cubo animado (inspirado en cube.ts del proyecto original)
interface AnimatedCubeProps {
  block: VisualBlock;
  halfSize: number;
  onDestroyed: (id: number) => void;
}

// Cargar textura porous.jpg
const loader = new THREE.TextureLoader();
const porousTexture = loader.load("/textures/porous.jpg");

// ============================================================================
// OPTIMIZACIÓN: Geometrías compartidas globales
// Evita crear nuevas geometrías para cada cubo, reduciendo uso de memoria GPU
// ============================================================================
const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

// Interfaz para parámetros de variante de cubo
interface CubeVariantParams {
  colors: BlockColors;
  patternFactor: number;
  patternScale: number;
  patternPositionRandomness: number;
  patternFaceConfig: "V" | "H" | "VH";
  thickness: number;
  scale: number;
}

// Shader material con textura real (como en el proyecto original)
const createNoisyCubeMaterial = (params: CubeVariantParams) => {
  const randomOffset = new THREE.Vector2(
    Math.random() * params.patternPositionRandomness,
    Math.random() * params.patternPositionRandomness
  );

  return new THREE.ShaderMaterial({
    uniforms: {
      u_texture: { value: porousTexture },
      u_color_top_bottom: { value: new THREE.Color(params.colors.topBottom) },
      u_color_front_back: { value: new THREE.Color(params.colors.frontBack) },
      u_color_left_right: { value: new THREE.Color(params.colors.leftRight) },
      u_pattern_scale: { value: params.patternScale },
      u_pattern_factor: { value: params.patternFactor },
      u_pattern_face_h: {
        value: params.patternFaceConfig.includes("H") ? 1.0 : 0.0,
      },
      u_pattern_face_v: {
        value: params.patternFaceConfig.includes("V") ? 1.0 : 0.0,
      },
      u_random_offset: { value: randomOffset },
      u_time: { value: 1.0 },
      u_thickness: { value: params.thickness },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D u_texture;
      uniform float u_thickness;
      uniform float u_time;
      varying vec2 vUv;
      varying vec3 vNormal;
      uniform vec3 u_color_top_bottom;
      uniform vec3 u_color_left_right;
      uniform vec3 u_color_front_back;
      uniform float u_pattern_factor;
      uniform float u_pattern_scale;
      uniform float u_pattern_face_h;
      uniform float u_pattern_face_v;
      uniform vec2 u_random_offset;

      vec4 LinearTosRGB(vec4 value) {
        vec3 lt = vec3(lessThanEqual(value.rgb, vec3(0.0031308)));
        vec3 v1 = value.rgb * 12.92;
        vec3 v2 = pow(value.rgb, vec3(0.41666)) * 1.055 - vec3(0.055);
        return vec4(mix(v2, v1, lt), value.a);
      }

      void main() {
        float uvScale = u_pattern_scale;
        vec2 scaledUV = vUv * uvScale + u_random_offset;
        vec4 texColor = texture2D(u_texture, scaledUV);
        float thickness = u_thickness;
        vec3 color;
        vec3 absNor = abs(vNormal);

        float mixFactor = texColor.r; // Assuming the texture is grayscale

        if (vNormal.x > 0.9) color = u_color_left_right;
        else if (vNormal.x < -0.9) color = u_color_left_right;
        else if (vNormal.y > 0.9) color = u_color_top_bottom;
        else if (vNormal.y < -0.9) color = u_color_top_bottom;
        else if (vNormal.z > 0.9) color = u_color_front_back;
        else if (vNormal.z < -0.9) color = u_color_front_back;
        else color = vec3(1.0, 1.0, 1.0); // Shouldn't happen; set to White

        if (u_pattern_face_h == 1.0) {
          if (vNormal.x > 0.9 || vNormal.x < -0.9 || vNormal.z > 0.9 || vNormal.z < -0.9) {
            color = mix(color + u_pattern_factor, color, mixFactor);
          }
        }

        if (u_pattern_face_v == 1.0) {
          if (vNormal.y > 0.9 || vNormal.y < -0.9 || vNormal.z > 0.9 || vNormal.z < -0.9) {
            color = mix(color + u_pattern_factor, color, mixFactor);
          }
        }

        if (vUv.y < thickness || vUv.y > 1.0 - thickness || vUv.x < thickness || vUv.x > 1.0 - thickness) {
          gl_FragColor = vec4(0.03, 0.03, 0.03, 1.0);
        } else {
          gl_FragColor = LinearTosRGB(vec4(color, 1.0));
        }
      }
    `,
    transparent: true,
  });
};

// ============================================================================
// OPTIMIZACIÓN: Cache de materiales por variante
// Evita crear nuevos ShaderMaterials cuando los parámetros son idénticos
// ============================================================================
const materialCache = new Map<string, THREE.ShaderMaterial>();

function getMaterialCacheKey(params: CubeVariantParams): string {
  return `${params.colors.topBottom}-${params.colors.frontBack}-${params.colors.leftRight}-${params.patternFactor}-${params.patternScale}-${params.patternFaceConfig}-${params.thickness}-${params.scale}`;
}

function getCachedMaterial(params: CubeVariantParams): THREE.ShaderMaterial {
  const key = getMaterialCacheKey(params);
  if (!materialCache.has(key)) {
    materialCache.set(key, createNoisyCubeMaterial(params));
  }
  return materialCache.get(key)!;
}

// Función optimizada para comparar parámetros de variante sin JSON.stringify
function variantParamsChanged(
  prev: CubeVariantParams | null,
  next: CubeVariantParams
): boolean {
  if (!prev) return true;
  return (
    prev.colors.topBottom !== next.colors.topBottom ||
    prev.colors.frontBack !== next.colors.frontBack ||
    prev.colors.leftRight !== next.colors.leftRight ||
    prev.patternFactor !== next.patternFactor ||
    prev.patternScale !== next.patternScale ||
    prev.patternFaceConfig !== next.patternFaceConfig ||
    prev.thickness !== next.thickness ||
    prev.scale !== next.scale
  );
}

// Componente para bloques activos (blancos con bordes)
// OPTIMIZACIÓN: Memoizado para evitar re-renders innecesarios
const ActiveCube = memo(function ActiveCube({
  position,
  variantParams,
}: {
  position: [number, number, number];
  variantParams: CubeVariantParams;
}) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // OPTIMIZACIÓN: Usar material cacheado en lugar de crear uno nuevo
  if (!materialRef.current) {
    materialRef.current = getCachedMaterial(variantParams);
  }

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value =
        state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={variantParams.scale} geometry={SHARED_BOX_GEOMETRY}>
      <primitive object={materialRef.current} attach="material" />
    </mesh>
  );
});

// OPTIMIZACIÓN: Memoizado para evitar re-renders innecesarios
const AnimatedCube = memo(function AnimatedCube({ block, halfSize, onDestroyed }: AnimatedCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  // OPTIMIZACIÓN: Reutilizar Vector3 para evitar creación de objetos en cada frame
  const tempVectorRef = useRef(new THREE.Vector3());
  const positionRef = useRef(
    new THREE.Vector3(
      block.x - halfSize + 0.5,
      block.y - halfSize + 0.5,
      block.z - halfSize + 0.5
    )
  );
  const scaleRef = useRef(block.scale);
  const prevVariantParamsRef = useRef<CubeVariantParams | null>(null);

  // OPTIMIZACIÓN: Usar material cacheado y comparación directa (sin JSON.stringify)
  if (variantParamsChanged(prevVariantParamsRef.current, block.variantParams)) {
    materialRef.current = getCachedMaterial(block.variantParams);
    prevVariantParamsRef.current = block.variantParams;
  }

  // Asegurar que el material siempre esté inicializado
  if (!materialRef.current) {
    materialRef.current = getCachedMaterial(block.variantParams);
    prevVariantParamsRef.current = block.variantParams;
  }

  useFrame((state) => {
    if (!meshRef.current) return;

    // OPTIMIZACIÓN: Reutilizar Vector3 en lugar de crear uno nuevo cada frame
    tempVectorRef.current.set(
      block.targetX - halfSize + 0.5,
      block.targetY - halfSize + 0.5,
      block.targetZ - halfSize + 0.5
    );
    positionRef.current.lerp(tempVectorRef.current, 0.22);
    meshRef.current.position.copy(positionRef.current);

    // Lerp escala (como en el proyecto original: 0.12)
    scaleRef.current += (block.targetScale - scaleRef.current) * 0.12;
    meshRef.current.scale.setScalar(scaleRef.current);

    // Actualizar tiempo para animación del ruido
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value =
        state.clock.elapsedTime * 0.05;
    }

    // Callback cuando termine de destruirse
    if (block.destroying && scaleRef.current < 0.01) {
      onDestroyed(block.id);
    }
  });

  return (
    <mesh ref={meshRef} geometry={SHARED_BOX_GEOMETRY}>
      <primitive object={materialRef.current!} attach="material" />
    </mesh>
  );
});

// Componente para bloques puzzle apilados (con animación)
interface AnimatedPuzzleCubeProps {
  block: VisualBlock;
  halfSize: number;
  onDestroyed: (id: number) => void;
  imageUrl: string;
  gridSize: number;
}

// OPTIMIZACIÓN: Memoizado para evitar re-renders innecesarios
const AnimatedPuzzleCube = memo(function AnimatedPuzzleCube({
  block,
  halfSize,
  onDestroyed,
  imageUrl,
  gridSize,
}: AnimatedPuzzleCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  // OPTIMIZACIÓN: Reutilizar Vector3 para evitar creación de objetos en cada frame
  const tempVectorRef = useRef(new THREE.Vector3());
  const positionRef = useRef(
    new THREE.Vector3(
      block.x - halfSize + 0.5,
      block.y - halfSize + 0.5,
      block.z - halfSize + 0.5
    )
  );
  const scaleRef = useRef(block.scale);

  useFrame(() => {
    if (!groupRef.current) return;

    // OPTIMIZACIÓN: Reutilizar Vector3 en lugar de crear uno nuevo cada frame
    tempVectorRef.current.set(
      block.targetX - halfSize + 0.5,
      block.targetY - halfSize + 0.5,
      block.targetZ - halfSize + 0.5
    );
    positionRef.current.lerp(tempVectorRef.current, 0.22);
    groupRef.current.position.copy(positionRef.current);

    // Lerp escala
    scaleRef.current += (block.targetScale - scaleRef.current) * 0.12;
    groupRef.current.scale.setScalar(scaleRef.current);

    // Callback cuando termine de destruirse
    if (block.destroying && scaleRef.current < 0.01) {
      onDestroyed(block.id);
    }
  });

  return (
    <group ref={groupRef}>
      <PuzzleTileCube
        position={[0, 0, 0]}
        imageUrl={imageUrl}
        gridSize={gridSize}
        tileX={block.puzzleTileX ?? 0}
        tileZ={block.puzzleTileZ ?? 0}
        scale={1}
      />
    </group>
  );
});

interface GameProps {
  levelDifficulty: LevelDifficulty;
  puzzleImageUrl?: string;
}

// Función helper para crear geometría de líneas del grid (solo horizontal/vertical, sin diagonales)
// Cache de geometrías por tamaño para evitar recálculos
const geometryCache = new Map<string, THREE.BufferGeometry>();

const createGridLinesGeometry = (
  width: number,
  height: number,
  segments: number
): THREE.BufferGeometry => {
  const cacheKey = `${width}-${height}-${segments}`;

  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!;
  }

  const geometry = new THREE.BufferGeometry();
  const points: number[] = [];

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Líneas horizontales
  for (let i = 0; i <= segments; i++) {
    const y = -halfHeight + (i / segments) * height;
    points.push(-halfWidth, y, 0); // Inicio
    points.push(halfWidth, y, 0); // Fin
  }

  // Líneas verticales
  for (let i = 0; i <= segments; i++) {
    const x = -halfWidth + (i / segments) * width;
    points.push(x, -halfHeight, 0); // Inicio
    points.push(x, halfHeight, 0); // Fin
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3)
  );

  geometryCache.set(cacheKey, geometry);
  return geometry;
};

// Componente completo para una superficie del grid (simplificado, sin marcadores)
interface GridPlaneProps {
  width: number;
  height: number;
  segments: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color?: string;
  visible?: boolean;
}

// OPTIMIZACIÓN: Memoizado para evitar re-renders innecesarios
const GridPlane = memo(function GridPlane({
  width,
  height,
  segments,
  position,
  rotation,
  color = "#4b5563",
  visible = true,
}: GridPlaneProps) {
  const linesGeometry = useMemo(
    () => createGridLinesGeometry(width, height, segments),
    [width, height, segments]
  );

  return (
    <group position={position} rotation={rotation} visible={visible}>
      {/* Líneas del grid */}
      <lineSegments geometry={linesGeometry}>
        <lineBasicMaterial color={color} />
      </lineSegments>
    </group>
  );
});

const LightingRig = () => (
  <>
    <color attach="background" args={["#1a1b26"]} />
    <ambientLight color="#ffffff" intensity={0.5} />
    <directionalLight color="#ffffff" intensity={0.8} position={[10, 15, 10]} />
  </>
);

// Tipo de estado del juego
type GameState = "waiting" | "playing" | "gameover" | "victory";

export default function Game({ levelDifficulty, puzzleImageUrl }: GameProps) {
  // Obtener configuración de dificultad
  const difficultyConfig = useMemo(() => getDifficultyConfig(levelDifficulty), [levelDifficulty]);
  const size = getGridSizeByLevelDifficulty(levelDifficulty);
  
  const cameraConfig = useCameraConfigStore((state) => state.config);
  const cycleTime = useGameSpeedStore((state) => state.cycleTime);
  const router = useRouter();
  const cameraRef = useRef<THREE.Camera | null>(null);
  const [cameraViewIndex, setCameraViewIndex] = useState<0 | 1 | 2 | 3>(0);
  const targetPositionRef = useRef<THREE.Vector3 | null>(null);
  const [grid, setGrid] = useState<Grid3D>(() => createEmptyGrid(size));
  const [activeType, setActiveType] = useState<TetrominoType>("I");
  const [activeRotation, setActiveRotation] = useState(0);
  const [nextPiece, setNextPiece] = useState<{
    type: TetrominoType;
    rotation: number;
    isPuzzle: boolean;
    puzzleCells?: Array<{ x: number; z: number }>;
  } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activePosition, setActivePosition] = useState<{
    x: number;
    y: number;
    z: number;
  }>({
    x: Math.floor(size / 2) - 1,
    y: size - 1,
    z: Math.floor(size / 2) - 1,
  });

  // Estado del juego: waiting (pantalla inicial), playing (jugando), gameover (perdió)
  const [gameState, setGameState] = useState<GameState>(
    puzzleImageUrl ? "waiting" : "playing"
  );

  // Sistema de bloques visuales con animación
  const [visualBlocks, setVisualBlocks] = useState<VisualBlock[]>([]);
  const [isFastForward, setIsFastForward] = useState(false);
  const lastTickTimeRef = useRef<number>(0);
  const [clearUsesRemaining, setClearUsesRemaining] = useState(difficultyConfig.clearCharges);
  
  // Sistema de tiempo - cuenta atrás
  const [timeRemaining, setTimeRemaining] = useState(difficultyConfig.timeLimitSeconds);
  const gameStartTimeRef = useRef<number>(0);
  
  // Sistema de puntuación
  const [totalLinesCleared, setTotalLinesCleared] = useState(0);
  const [finalScore, setFinalScore] = useState<GameScore | null>(null);
  
  // Sistema de ciclo puzzle/normal - contador simple de posición
  // El ciclo se repite: primero N piezas puzzle, luego M piezas normales
  const [cyclePosition, setCyclePosition] = useState(0);
  
  // Para dificultades con rango aleatorio de normales, guardamos el target del ciclo actual
  const [currentNormalTarget, setCurrentNormalTarget] = useState(() => getNormalPiecesCount(levelDifficulty));
  
  // Función para determinar si una posición en el ciclo debe ser pieza puzzle
  const shouldPositionBePuzzle = useCallback((pos: number, normalTarget: number): boolean => {
    const puzzleCount = getPuzzlePiecesCount(levelDifficulty);
    const cycleLength = puzzleCount + normalTarget;
    const posInCycle = pos % cycleLength;
    return posInCycle < puzzleCount;
  }, [levelDifficulty]);
  
  // Contador de piezas normales consecutivas (para pieza de ayuda 1x1)
  // Cada 5 piezas normales consecutivas, se genera una pieza O1 (1x1) para ayudar
  const [consecutiveNormalCount, setConsecutiveNormalCount] = useState(0);
  const NORMAL_PIECES_FOR_HELPER = 5; // Cada N piezas normales, dar pieza de ayuda

  // Sistema puzzle - OPTIMIZACIÓN: Selectores específicos en lugar de suscribirse a todo el store
  const currentPuzzlePiece = usePuzzleStore((state) => state.currentPuzzlePiece);
  const pattern = usePuzzleStore((state) => state.pattern);
  const remainingPieces = usePuzzleStore((state) => state.remainingPieces);
  const placedPieces = usePuzzleStore((state) => state.placedPieces);
  const pieceCounter = usePuzzleStore((state) => state.pieceCounter);
  const testMode = usePuzzleStore((state) => state.testMode);
  // Actions sin suscripción usando getState()
  const puzzleActions = usePuzzleStore.getState();
  const [lockedPieces, setLockedPieces] = useState<Set<string>>(new Set()); // IDs de piezas bloqueadas (no eliminables)

  // Sistema de pantalla completa
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sistema de audio y camera shake
  const initializeAudio = useAudioStore((state) => state.initialize);
  const isMuted = useAudioStore((state) => state.isMuted);
  const toggleMute = useAudioStore((state) => state.toggleMute);
  const { shake, shakeStateRef, offsetRef } = useCameraShake();
  const cameraBasePositionRef = useRef<THREE.Vector3 | null>(null);

  // Toggle pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        useGameLogStore.getState().addError("Error al activar pantalla completa", err, "toggleFullscreen");
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        useGameLogStore.getState().addError("Error al salir de pantalla completa", err, "toggleFullscreen");
      });
    }
  }, []);

  // Escuchar cambios de fullscreen (por si el usuario usa ESC o F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Inicializar sistema de audio
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  // Callback cuando un bloque termina de destruirse
  const handleBlockDestroyed = useCallback((id: number) => {
    setVisualBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Función para limpiar todos los bloques NO bloqueados en todo el espacio de juego
  // Mantiene intactos SOLO los bloques de puzzle que ya están bloqueados (colocados correctamente)
  const clearAboveFloor = useCallback(() => {
    // Verificar si hay usos restantes
    if (clearUsesRemaining <= 0) {
      return;
    }

    // Decrementar contador
    setClearUsesRemaining((prev) => prev - 1);

    // Reproducir sonido de poder
    audioActions.playPowerClear();

    // Calcular posiciones bloqueadas (celdas de piezas puzzle colocadas correctamente)
    const lockedPositions = new Set<string>();
    placedPieces.forEach((piece) => {
      if (lockedPieces.has(piece.id)) {
        piece.cells.forEach((cell) => {
          // Las piezas puzzle bloqueadas están en Y=0
          lockedPositions.add(`${cell.x},0,${cell.z}`);
        });
      }
    });

    // Actualizar grid lógico: vaciar todas las celdas EXCEPTO las bloqueadas
    setGrid((prevGrid) => {
      const newGrid: Grid3D = prevGrid.map((plane) =>
        plane.map((row) => [...row])
      );
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; z++) {
            const posKey = `${x},${y},${z}`;
            // Solo vaciar si NO está bloqueada
            if (!lockedPositions.has(posKey)) {
              newGrid[x][y][z] = "empty";
            }
          }
        }
      }
      return newGrid;
    });

    // Actualizar bloques visuales: marcar como destroying los que NO son puzzle bloqueados
    setVisualBlocks((prev) =>
      prev.map((block) => {
        const posKey = `${block.targetX},${block.targetY},${block.targetZ}`;
        // Destruir el bloque si NO está en una posición bloqueada
        if (!lockedPositions.has(posKey)) {
          return {
            ...block,
            targetScale: 0,
            destroying: true,
          };
        }
        return block;
      })
    );
  }, [size, clearUsesRemaining, lockedPieces, placedPieces]);

  // Parámetros de variante para bloques apilados (basado en altura, como en el original)
  const getBlockVariantParams = useCallback((y: number): CubeVariantParams => {
    const variants: CubeVariantParams[] = [
      // Y=0 (rosa pastel más intenso)
      {
        colors: {
          topBottom: "#ff8ba8",
          frontBack: "#f07b98",
          leftRight: "#ff9bb8",
        },
        patternFactor: -0.93,
        patternScale: 0.45,
        patternPositionRandomness: 0.11,
        patternFaceConfig: "VH",
        thickness: 0.0,
        scale: 1,
      },
      // Y=1 (azul cielo más intenso)
      {
        colors: {
          topBottom: "#7ba5d8",
          frontBack: "#6b95c8",
          leftRight: "#8bb5e8",
        },
        patternFactor: -0.31,
        patternScale: 0.205,
        patternPositionRandomness: 0.11,
        patternFaceConfig: "VH",
        thickness: 0.0,
        scale: 1,
      },
      // Y=2 (melocotón pastel más intenso)
      {
        colors: {
          topBottom: "#ffb88e",
          frontBack: "#f0a87e",
          leftRight: "#ffc89e",
        },
        patternFactor: -1.0,
        patternScale: 0.62,
        patternPositionRandomness: 0.11,
        patternFaceConfig: "VH",
        thickness: 0.0,
        scale: 1,
      },
    ];
    return variants[y % variants.length];
  }, []);

  // Parámetros para bloque activo (dante)
  const getActiveBlockVariantParams = useCallback((): CubeVariantParams => {
    return {
      colors: {
        topBottom: "#ffffff",
        frontBack: "#ffffff",
        leftRight: "#ffffff",
      },
      patternFactor: -1.0,
      patternScale: 0.32,
      patternPositionRandomness: 0.14,
      patternFaceConfig: "VH",
      thickness: 0.02,
      scale: 0.9,
    };
  }, []);

  // Reiniciar grid y pieza al cambiar el tamaño (dificultad) o imagen de puzzle
  useEffect(() => {
    const config = getDifficultyConfig(levelDifficulty);
    setGrid(createEmptyGrid(size));
    setActiveType("I");
    setActiveRotation(0);
    setActivePosition({
      x: Math.floor(size / 2) - 1,
      y: size - 1,
      z: Math.floor(size / 2) - 1,
    });
    setIsGameOver(false);
    setVisualBlocks([]);
    setIsFastForward(false);
    lastTickTimeRef.current = performance.now();
    blockIdCounter = 0;
    setLockedPieces(new Set());
    setClearUsesRemaining(config.clearCharges);
    setTimeRemaining(config.timeLimitSeconds);
    setTotalLinesCleared(0);
    setFinalScore(null);
    setCyclePosition(0);
    setCurrentNormalTarget(getNormalPiecesCount(levelDifficulty));
    setConsecutiveNormalCount(0);
    // Resetear estado del juego según si hay imagen de puzzle
    setGameState(puzzleImageUrl ? "waiting" : "playing");
    if (puzzleImageUrl) {
      const seed = Math.floor(Math.random() * 1000000);
      const puzzleResult = generatePuzzlePattern(size, seed);
      puzzleActions.initializeFromResult(seed, puzzleResult);
    } else {
      puzzleActions.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, puzzleImageUrl, levelDifficulty]);

  // Función para iniciar el juego
  const startGame = useCallback(() => {
    const diffLabel = getDifficultyLabel(levelDifficulty);
    const startDetails = `Inicio de juego - Dificultad: ${diffLabel}, Tamaño del grid: ${size}x${size}, Modo: ${puzzleImageUrl ? "Puzzle" : "Normal"}`;
    
    // Log de inicio del juego
    useGameLogStore.getState().addLog({
      type: "game_start",
      details: startDetails,
    });
    
    // Guardar tiempo de inicio para calcular duración
    gameStartTimeRef.current = Date.now();
    
    // Obtener el target de normales para este ciclo
    const normalTarget = getNormalPiecesCount(levelDifficulty);
    setCurrentNormalTarget(normalTarget);
    
    // Posición 0 del ciclo - determinar si debe ser puzzle
    const firstShouldBePuzzle = shouldPositionBePuzzle(0, normalTarget);
    
    // Filtrar piezas puzzle disponibles
    const availablePieces = remainingPieces.filter(
      (p) => !lockedPieces.has(p.id)
    );
    
    // Spawnear primera pieza
    if (puzzleImageUrl && firstShouldBePuzzle && availablePieces.length > 0 && !currentPuzzlePiece) {
      const firstPuzzlePiece = availablePieces[0];
      puzzleActions.setCurrentPuzzlePiece(firstPuzzlePiece);
      setActiveType(firstPuzzlePiece.type);
      setActiveRotation(firstPuzzlePiece.rotation);
      const spawnPos = {
        x: Math.floor(size / 2) - 1,
        y: size - 1,
        z: Math.floor(size / 2) - 1,
      };
      setActivePosition(spawnPos);

      // Log spawn de primera pieza puzzle
      useGameLogStore.getState().addLog({
        type: "spawn",
        pieceId: firstPuzzlePiece.id,
        pieceType: firstPuzzlePiece.type,
        position: spawnPos,
        rotation: firstPuzzlePiece.rotation,
        patternRotation: firstPuzzlePiece.rotation,
        remainingPieces: remainingPieces.length,
        totalPieces: pattern.length,
        details: "Primera pieza puzzle (startGame, cyclePos=0)",
      });
    }
    
    // Inicializar preview de siguiente pieza basado en el ciclo (posición 1)
    const nextShouldBePuzzle = shouldPositionBePuzzle(1, normalTarget);
    
    if (puzzleImageUrl && nextShouldBePuzzle && availablePieces.length > 1) {
      // La siguiente debe ser puzzle
      const nextPuzzle = availablePieces[1];
      setNextPiece({
        type: nextPuzzle.type,
        rotation: nextPuzzle.rotation,
        isPuzzle: true,
        puzzleCells: nextPuzzle.cells,
      });
    } else {
      // La siguiente debe ser normal
      const previewTypes: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
      const nextPreviewType = previewTypes[Math.floor(Math.random() * previewTypes.length)] ?? "I";
      setNextPiece({ type: nextPreviewType, rotation: 0, isPuzzle: false });
    }

    setGameState("playing");
    lastTickTimeRef.current = performance.now();
  }, [puzzleImageUrl, remainingPieces, currentPuzzlePiece, size, lockedPieces, puzzleActions, levelDifficulty, pattern, shouldPositionBePuzzle]);

  // Función para reiniciar el juego
  const restartGame = useCallback(() => {
    const config = getDifficultyConfig(levelDifficulty);
    setGrid(createEmptyGrid(size));
    setActiveType("I");
    setActiveRotation(0);
    setActivePosition({
      x: Math.floor(size / 2) - 1,
      y: size - 1,
      z: Math.floor(size / 2) - 1,
    });
    setIsGameOver(false);
    setVisualBlocks([]);
    setIsFastForward(false);
    setNextPiece(null);
    lastTickTimeRef.current = performance.now();
    blockIdCounter = 0;
    setLockedPieces(new Set());
    setClearUsesRemaining(config.clearCharges);
    setTimeRemaining(config.timeLimitSeconds);
    setTotalLinesCleared(0);
    setFinalScore(null);
    setCyclePosition(0);
    setCurrentNormalTarget(getNormalPiecesCount(levelDifficulty));
    setConsecutiveNormalCount(0);
    
    // Limpiar logs y errores al reiniciar
    useGameLogStore.getState().clearAll();

    if (puzzleImageUrl) {
      const seed = Math.floor(Math.random() * 1000000);
      const puzzleResult = generatePuzzlePattern(size, seed);
      puzzleActions.initializeFromResult(seed, puzzleResult);
      setGameState("waiting");
    } else {
      puzzleActions.reset();
      setGameState("playing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, puzzleImageUrl, levelDifficulty]);

  // Función para imprimir resumen final del juego
  const printFinalGameSummary = useCallback(() => {
    useGameLogStore.getState().printGameSummary();
  }, []);

  const halfSize = size / 2;

  // 4 posiciones fijas de cámara (configurables desde el store)
  const cameraPositions = useMemo(() => {
    const height = size * cameraConfig.heightMultiplier;
    const offset = cameraConfig.offset;
    const distance = size * cameraConfig.distanceMultiplier;

    // Posiciones asimétricas con offset para vista más frontal
    return [
      // Vista 0: Más frontal (X reducido por offset)
      new THREE.Vector3(distance - offset, height, distance),
      // Vista 1: Rotada 90°
      new THREE.Vector3(distance, height, -distance + offset),
      // Vista 2: Rotada 180°
      new THREE.Vector3(-distance + offset, height, -distance),
      // Vista 3: Rotada 270°
      new THREE.Vector3(-distance, height, distance - offset),
    ];
  }, [size, cameraConfig]);

  // Detecta líneas completas y retorna bloques a eliminar y movimientos
  // Las piezas bloqueadas SÍ cuentan para completar líneas pero NO se eliminan
  const detectLineClears = useCallback(
    (
      gridToCheck: Grid3D,
      level: number,
      lockedPositions: Set<string> = new Set()
    ): {
      toRemove: { x: number; z: number }[];
      toMove: { x: number; z: number; fromY: number; toY: number }[];
    } => {
      const toRemove: { x: number; z: number }[] = [];
      const toMove: { x: number; z: number; fromY: number; toY: number }[] = [];

      if (level < 0 || level >= size) {
        return { toRemove, toMove };
      }

      // lockedPositions ya viene calculado con todas las celdas protegidas
      // incluyendo la pieza recién colocada

      // Verificar líneas Z (para cada X fijo)
      // Las celdas bloqueadas SÍ cuentan como "filled" para completar la línea
      for (let x = 0; x < size; x++) {
        let zLineFull = true;
        for (let z = 0; z < size; z++) {
          // Solo las celdas vacías rompen la línea (bloqueadas cuentan como filled)
          if (gridToCheck[x][level][z] !== "filled") {
            zLineFull = false;
            break;
          }
        }
        if (zLineFull) {
          for (let z = 0; z < size; z++) {
            // Solo proteger bloques en Y=0; en niveles superiores todos son eliminables
            if (level > 0 || !lockedPositions.has(`${x},${z}`)) {
              toRemove.push({ x, z });
            }
            // Marcar bloques superiores para bajar
            // En Y>0 todos los bloques pueden moverse; en Y=0 solo los no bloqueados
            for (let yy = level + 1; yy < size; yy++) {
              if (
                gridToCheck[x][yy][z] === "filled" &&
                (level > 0 || !lockedPositions.has(`${x},${z}`))
              ) {
                toMove.push({ x, z, fromY: yy, toY: yy - 1 });
              }
            }
          }
        }
      }

      // Verificar líneas X (para cada Z fijo)
      // Las celdas bloqueadas SÍ cuentan como "filled" para completar la línea
      for (let z = 0; z < size; z++) {
        let xLineFull = true;
        for (let x = 0; x < size; x++) {
          // Solo las celdas vacías rompen la línea (bloqueadas cuentan como filled)
          if (gridToCheck[x][level][z] !== "filled") {
            xLineFull = false;
            break;
          }
        }
        if (xLineFull) {
          for (let x = 0; x < size; x++) {
            // Solo añadir si no está ya en toRemove
            // Solo proteger bloques en Y=0; en niveles superiores todos son eliminables
            if (
              !toRemove.some((r) => r.x === x && r.z === z) &&
              (level > 0 || !lockedPositions.has(`${x},${z}`))
            ) {
              toRemove.push({ x, z });
            }
            // Marcar bloques superiores para bajar
            // En Y>0 todos los bloques pueden moverse; en Y=0 solo los no bloqueados
            for (let yy = level + 1; yy < size; yy++) {
              if (
                gridToCheck[x][yy][z] === "filled" &&
                (level > 0 || !lockedPositions.has(`${x},${z}`))
              ) {
                const existing = toMove.find(
                  (m) => m.x === x && m.z === z && m.fromY === yy
                );
                if (!existing) {
                  toMove.push({ x, z, fromY: yy, toY: yy - 1 });
                }
              }
            }
          }
        }
      }

      return { toRemove, toMove };
    },
    [size]
  );

  // Aplica la limpieza al grid lógico
  // Las piezas bloqueadas en Y=0 SÍ cuentan para completar líneas pero NO se mueven ni eliminan
  // En niveles Y>0, todos los bloques son movibles/eliminables
  const applyLineClearToGrid = useCallback(
    (
      gridToClean: Grid3D,
      level: number,
      lockedPositions: Set<string> = new Set()
    ): Grid3D => {
      if (level < 0 || level >= size) {
        return gridToClean;
      }

      // lockedPositions ya viene calculado con todas las celdas protegidas
      // incluyendo la pieza recién colocada

      const shiftColumnDown = (x: number, z: number, startLevel: number) => {
        // Si hay pieza bloqueada en Y=0 y estamos limpiando nivel 0,
        // mantenerla fija pero permitir que bloques superiores caigan hacia Y=1
        const hasLockedAtY0 = lockedPositions.has(`${x},${z}`);
        
        // Si level=0 y hay bloque bloqueado, empezar desde Y=1 para no tocar Y=0
        // Si level>0, hacer shift normal desde el nivel de la línea eliminada
        const minY = (startLevel === 0 && hasLockedAtY0) ? 1 : startLevel;
        
        for (let yy = minY; yy < size - 1; yy++) {
          gridToClean[x][yy][z] = gridToClean[x][yy + 1][z];
        }
        gridToClean[x][size - 1][z] = "empty";
      };

      let changed = true;
      while (changed) {
        changed = false;

        // Set para recopilar columnas que necesitan shift (evita duplicados)
        const columnsToShift = new Set<string>();

        // Detectar líneas Z completas (para cada X fijo) - SIN modificar el grid
        for (let x = 0; x < size; x++) {
          let zLineFull = true;
          for (let z = 0; z < size; z++) {
            // Bloques bloqueados SÍ cuentan como filled para completar línea
            if (gridToClean[x][level][z] !== "filled") {
              zLineFull = false;
              break;
            }
          }
          if (zLineFull) {
            for (let z = 0; z < size; z++) {
              // En Y=0: solo mover columnas no bloqueadas
              // En Y>0: mover todas las columnas (la protección solo aplica a Y=0)
              if (level > 0 || !lockedPositions.has(`${x},${z}`)) {
                columnsToShift.add(`${x},${z}`);
              }
            }
          }
        }

        // Detectar líneas X completas (para cada Z fijo) - SIN modificar el grid
        for (let z = 0; z < size; z++) {
          let xLineFull = true;
          for (let x = 0; x < size; x++) {
            // Bloques bloqueados SÍ cuentan como filled para completar línea
            if (gridToClean[x][level][z] !== "filled") {
              xLineFull = false;
              break;
            }
          }
          if (xLineFull) {
            for (let x = 0; x < size; x++) {
              // En Y=0: solo mover columnas no bloqueadas
              // En Y>0: mover todas las columnas (la protección solo aplica a Y=0)
              if (level > 0 || !lockedPositions.has(`${x},${z}`)) {
                columnsToShift.add(`${x},${z}`);
              }
            }
          }
        }

        // Aplicar shifts a todas las columnas detectadas (después de detectar TODAS las líneas)
        if (columnsToShift.size > 0) {
          columnsToShift.forEach((key) => {
            const [x, z] = key.split(",").map(Number);
            shiftColumnDown(x, z, level);
          });
          changed = true;
        }
      }

      return gridToClean;
    },
    [size]
  );

  // Procesa todas las líneas completas de forma iterativa hasta que no haya más
  const processLineClearsIteratively = useCallback(
    (
      gridToProcess: Grid3D,
      lockedPositions: Set<string> = new Set()
    ): {
      blocksToRemove: { x: number; y: number; z: number }[];
      blocksToMove: { x: number; y: number; z: number; newY: number }[];
      finalGrid: Grid3D;
    } => {
      try {
        const blocksToRemove: { x: number; y: number; z: number }[] = [];

        // Guardar el grid original para comparar después
        const originalGrid: Grid3D = gridToProcess.map((plane) =>
          plane.map((row) => [...row])
        );

        // Crear una copia del grid para trabajar
        let workingGrid: Grid3D = gridToProcess.map((plane) =>
          plane.map((row) => [...row])
        );

        let hasMoreLines = true;
        const maxIterations = 100; // Prevenir bucles infinitos
        let iterations = 0;

        while (hasMoreLines && iterations < maxIterations) {
          iterations++;
          hasMoreLines = false;

          // Verificar todos los niveles desde 0 hasta MAX_STACK_HEIGHT
          for (let level = 0; level < MAX_STACK_HEIGHT; level++) {
            const { toRemove } = detectLineClears(
              workingGrid,
              level,
              lockedPositions
            );

            if (toRemove.length > 0) {
              hasMoreLines = true;

              // Añadir bloques a eliminar (con su coordenada Y)
              toRemove.forEach((r) => {
                if (
                  !blocksToRemove.some(
                    (b) => b.x === r.x && b.y === level && b.z === r.z
                  )
                ) {
                  blocksToRemove.push({ x: r.x, y: level, z: r.z });
                }
              });

              // Aplicar la limpieza al grid de trabajo
              workingGrid = applyLineClearToGrid(
                workingGrid,
                level,
                lockedPositions
              );
            }
          }
        }

        // Calcular los movimientos finales comparando el grid original con el final
        // Para cada columna (x, z), calcular cuántos bloques hay en cada nivel
        // y mapear los bloques originales a sus nuevas posiciones
        const blocksToMove: {
          x: number;
          y: number;
          z: number;
          newY: number;
        }[] = [];

        // Para cada columna (x, z)
        for (let x = 0; x < size; x++) {
          for (let z = 0; z < size; z++) {
            // Obtener todos los bloques originales en esta columna (de arriba hacia abajo)
            const originalBlocksInColumn: number[] = [];
            for (let y = MAX_STACK_HEIGHT - 1; y >= 0; y--) {
              if (originalGrid[x][y][z] === "filled") {
                // Verificar si este bloque no fue eliminado
                const wasRemoved = blocksToRemove.some(
                  (r) => r.x === x && r.y === y && r.z === z
                );
                if (!wasRemoved) {
                  originalBlocksInColumn.push(y);
                }
              }
            }

            // Obtener todas las posiciones ocupadas en el grid final (de arriba hacia abajo)
            const finalBlocksInColumn: number[] = [];
            for (let y = MAX_STACK_HEIGHT - 1; y >= 0; y--) {
              if (workingGrid[x][y][z] === "filled") {
                finalBlocksInColumn.push(y);
              }
            }

            // Mapear cada bloque original a su nueva posición
            // Asumimos que los bloques mantienen su orden relativo
            for (let i = 0; i < originalBlocksInColumn.length; i++) {
              const originalY = originalBlocksInColumn[i];
              if (i < finalBlocksInColumn.length) {
                const newY = finalBlocksInColumn[i];
                if (newY !== originalY) {
                  blocksToMove.push({
                    x,
                    y: originalY,
                    z,
                    newY,
                  });
                }
              }
            }
          }
        }

        return {
          blocksToRemove,
          blocksToMove,
          finalGrid: workingGrid,
        };
      } catch (error) {
        useGameLogStore.getState().addError("Error in processLineClearsIteratively", error, "processLineClearsIteratively");
        // Retornar valores seguros para no crashear el juego
        return {
          blocksToRemove: [],
          blocksToMove: [],
          finalGrid: gridToProcess,
        };
      }
    },
    [size, detectLineClears, applyLineClearToGrid]
  );

  const isInsideBounds = useCallback(
    (x: number, y: number, z: number): boolean =>
      x >= 0 && x < size && y >= 0 && y < size && z >= 0 && z < size,
    [size]
  );

  const activeShape = useMemo(
    () => rotateShapeHorizontal(TETROMINO_SHAPES[activeType], activeRotation),
    [activeType, activeRotation]
  );

  const activeWorldBlocks = useMemo(
    () =>
      activeShape.map((cell) => ({
        x: activePosition.x + cell.x,
        y: activePosition.y + cell.y,
        z: activePosition.z + cell.z,
      })),
    [activeShape, activePosition]
  );

  // OPTIMIZACIÓN: Refs para valores que cambian frecuentemente pero no necesitan re-crear el useEffect
  const activePositionRef = useRef(activePosition);
  const activeShapeRef = useRef(activeShape);
  const activeWorldBlocksRef = useRef(activeWorldBlocks);
  const activeRotationRef = useRef(activeRotation);
  const gridRef = useRef(grid);
  const lockedPiecesRef = useRef(lockedPieces);
  const isFastForwardRef = useRef(isFastForward);
  const currentPuzzlePieceRef = useRef(currentPuzzlePiece);
  const patternRef = useRef(pattern);
  const placedPiecesRef = useRef(placedPieces);
  const remainingPiecesRef = useRef(remainingPieces);
  const pieceCounterRef = useRef(pieceCounter);
  const testModeRef = useRef(testMode);
  const nextPieceRef = useRef(nextPiece);
  const cyclePositionRef = useRef(cyclePosition);
  const currentNormalTargetRef = useRef(currentNormalTarget);
  const consecutiveNormalCountRef = useRef(consecutiveNormalCount);
  const totalLinesClearedRef = useRef(totalLinesCleared);
  const timeRemainingRef = useRef(timeRemaining);

  // OPTIMIZACIÓN: Pool de objetos reutilizables para evitar GC
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _vectorPool = useRef({
    temp1: new THREE.Vector3(),
    temp2: new THREE.Vector3(),
    temp3: new THREE.Vector3(),
  });

  // OPTIMIZACIÓN: Sincronizar refs con estado en un solo useEffect consolidado
  // Esto evita race conditions donde los refs podrían estar desactualizados
  // si se actualizan en useEffects separados con timing diferente
  useEffect(() => {
    activePositionRef.current = activePosition;
    activeShapeRef.current = activeShape;
    activeWorldBlocksRef.current = activeWorldBlocks;
    activeRotationRef.current = activeRotation;
    gridRef.current = grid;
    lockedPiecesRef.current = lockedPieces;
    isFastForwardRef.current = isFastForward;
    currentPuzzlePieceRef.current = currentPuzzlePiece;
    patternRef.current = pattern;
    placedPiecesRef.current = placedPieces;
    remainingPiecesRef.current = remainingPieces;
    pieceCounterRef.current = pieceCounter;
    testModeRef.current = testMode;
    nextPieceRef.current = nextPiece;
    cyclePositionRef.current = cyclePosition;
    currentNormalTargetRef.current = currentNormalTarget;
    consecutiveNormalCountRef.current = consecutiveNormalCount;
    totalLinesClearedRef.current = totalLinesCleared;
    timeRemainingRef.current = timeRemaining;
  }, [
    activePosition,
    activeShape,
    activeWorldBlocks,
    activeRotation,
    grid,
    lockedPieces,
    isFastForward,
    currentPuzzlePiece,
    pattern,
    placedPieces,
    remainingPieces,
    pieceCounter,
    testMode,
    nextPiece,
    cyclePosition,
    currentNormalTarget,
    consecutiveNormalCount,
    totalLinesCleared,
    timeRemaining,
  ]);
  
  // Sistema de timer - cuenta atrás
  useEffect(() => {
    // Solo ejecutar timer cuando el juego está en estado "playing"
    if (gameState !== "playing") {
      return;
    }
    
    const timerInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Tiempo agotado - Game Over
          clearInterval(timerInterval);
          setIsGameOver(true);
          setGameState("gameover");
          audioActions.playGameOver();
          
          // Log timeout
          useGameLogStore.getState().addLog({
            type: "gameover",
            placedPieces: usePuzzleStore.getState().placedPieces.length,
            totalPieces: patternRef.current.length,
            details: "Tiempo agotado",
          });
          
          // Imprimir resumen del juego
          setTimeout(() => {
            useGameLogStore.getState().printGameSummary();
          }, 100);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(timerInterval);
    };
  }, [gameState]);

  // OPTIMIZACIÓN: Pre-calcular placedPuzzleCellsMap cuando cambia placedPieces
  const placedPuzzleCellsMap = useMemo(() => {
    const map = new Map<string, { tileX: number; tileZ: number }>();
    placedPieces.forEach((piece) => {
      piece.cells.forEach((cell) => {
        map.set(`${cell.x},${cell.z}`, {
          tileX: cell.x,
          tileZ: cell.z,
        });
      });
    });
    return map;
  }, [placedPieces]);

  // Ref para placedPuzzleCellsMap (evita re-crear el tick loop cuando cambia)
  const placedPuzzleCellsMapRef = useRef(placedPuzzleCellsMap);
  useEffect(() => {
    placedPuzzleCellsMapRef.current = placedPuzzleCellsMap;
  }, [placedPuzzleCellsMap]);

  const checkCollision = useCallback(
    (
      blocks: { x: number; y: number; z: number }[],
      gridToCheck: Grid3D = grid
    ): boolean =>
      blocks.some((block) => {
        if (!isInsideBounds(block.x, block.y, block.z)) return true;
        return gridToCheck[block.x][block.y][block.z] === "filled";
      }),
    [grid, isInsideBounds]
  );

  // Calcular posición donde caería la pieza
  const calculateDropPosition = useCallback((): {
    x: number;
    y: number;
    z: number;
  }[] => {
    let dropOffset = 0;

    // Simular caída hasta encontrar colisión
    while (true) {
      const testBlocks = activeShape.map((cell) => ({
        x: activePosition.x + cell.x,
        y: activePosition.y - dropOffset - 1 + cell.y,
        z: activePosition.z + cell.z,
      }));

      if (checkCollision(testBlocks)) {
        break;
      }
      dropOffset++;

      // Prevenir bucle infinito si la pieza está fuera de bounds
      if (activePosition.y - dropOffset < 0) {
        break;
      }
    }

    // Retornar bloques en la posición de caída
    return activeShape.map((cell) => ({
      x: activePosition.x + cell.x,
      y: activePosition.y - dropOffset + cell.y,
      z: activePosition.z + cell.z,
    }));
  }, [activeShape, activePosition, checkCollision]);

  // Memoizar la posición de caída para optimizar
  const dropPositionBlocks = useMemo(
    () => calculateDropPosition(),
    [calculateDropPosition]
  );

  // Material de shader para mostrar solo bordes en los cubos ghost (caída)
  const ghostMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          u_thickness: { value: 0.03 },
          u_color: { value: new THREE.Color("#ffff00") },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float u_thickness;
          uniform vec3 u_color;
          void main() {
            float thickness = u_thickness;
            if (vUv.y < thickness || vUv.y > 1.0 - thickness || 
                vUv.x < thickness || vUv.x > 1.0 - thickness) {
              gl_FragColor = vec4(u_color, 0.8);
            } else {
              gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            }
          }
        `,
        transparent: true,
      }),
    []
  );

  // Material para el indicador de posición destino de piezas puzzle (verde)
  const puzzleTargetMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          u_thickness: { value: 0.05 },
          u_color: { value: new THREE.Color("#00ff88") },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float u_thickness;
          uniform vec3 u_color;
          void main() {
            float thickness = u_thickness;
            if (vUv.y < thickness || vUv.y > 1.0 - thickness || 
                vUv.x < thickness || vUv.x > 1.0 - thickness) {
              gl_FragColor = vec4(u_color, 0.9);
            } else {
              gl_FragColor = vec4(u_color, 0.2);
            }
          }
        `,
        transparent: true,
      }),
    []
  );

  const cameraCorrection = useCallback(
    (
      action: "left" | "right" | "up" | "down"
    ): "left" | "right" | "up" | "down" => {
      // Implementación exacta del repo kamilmac/tetris
      switch (cameraViewIndex) {
        case 0:
          return action;
        case 1:
          switch (action) {
            case "left":
              return "down";
            case "right":
              return "up";
            case "up":
              return "left";
            case "down":
              return "right";
            default:
              return action;
          }
        case 2:
          switch (action) {
            case "left":
              return "right";
            case "right":
              return "left";
            case "up":
              return "down";
            case "down":
              return "up";
            default:
              return action;
          }
        case 3:
          switch (action) {
            case "left":
              return "up";
            case "right":
              return "down";
            case "up":
              return "right";
            case "down":
              return "left";
            default:
              return action;
          }
        default:
          return action;
      }
    },
    [cameraViewIndex]
  );
  // Lerp suave de la cámara (ajustado para centrar el grid)
  useEffect(() => {
    if (!targetPositionRef.current) return;

    const camera = cameraRef.current;
    if (!camera) return;

    const animate = () => {
      if (!targetPositionRef.current) return;

      camera.position.lerp(targetPositionRef.current, 0.08);
      const distance = camera.position.distanceTo(targetPositionRef.current);

      if (distance < 0.005) {
        camera.position.copy(targetPositionRef.current);
        targetPositionRef.current = null;
      } else {
        requestAnimationFrame(animate);
      }

      // lookAt al origen (0,0,0) donde está centrado el grid
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    };

    animate();
  }, [cameraViewIndex, cameraPositions]);

  const rotateCameraView = useCallback(
    (direction: "left" | "right") => {
      const currentView = cameraViewIndex;
      const nextView =
        direction === "right"
          ? (((currentView + 1) % 4) as 0 | 1 | 2 | 3)
          : (((currentView - 1 + 4) % 4) as 0 | 1 | 2 | 3);

      setCameraViewIndex(nextView);
      targetPositionRef.current = cameraPositions[nextView];
    },
    [cameraViewIndex, cameraPositions]
  );

  // Caída automática en eje Y usando requestAnimationFrame (como el proyecto original)
  // OPTIMIZACIÓN: Usar refs para reducir dependencias del useEffect
  useEffect(() => {
    // Solo ejecutar cuando el juego está en estado "playing"
    if (isGameOver || gameState !== "playing") {
      return;
    }

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
        const currentLockedPieces = lockedPiecesRef.current;
        const currentPuzzlePiece = currentPuzzlePieceRef.current;
        const currentPattern = patternRef.current;
        const currentPlacedPieces = placedPiecesRef.current;
        const currentRemainingPieces = remainingPiecesRef.current;

        const nextPosition = {
          x: currentPosition.x,
          y: currentPosition.y - 1,
          z: currentPosition.z,
        };

        const nextBlocks = currentShape.map((cell) => ({
          x: nextPosition.x + cell.x,
          y: nextPosition.y + cell.y,
          z: nextPosition.z + cell.z,
        }));

        // Usar checkCollision con el grid del ref
        const hasCollision = nextBlocks.some((block) => {
          if (!isInsideBounds(block.x, block.y, block.z)) return true;
          return currentGrid[block.x][block.y][block.z] === "filled";
        });

        if (hasCollision) {
          try {
            // Fijar pieza en el grid en la posición actual
            const currentActiveWorldBlocks = activeWorldBlocksRef.current;
            const highestBlock = Math.max(
              ...currentActiveWorldBlocks.map((block) => block.y)
            );
            const reachedLimit = highestBlock >= MAX_STACK_HEIGHT;

            // Resetear fastForward cuando la pieza se bloquea
            setIsFastForward(false);

            // Verificar si es una pieza puzzle y si coincide con el patrón
            let isPuzzleCorrectlyPlaced = false;

          if (currentPuzzlePiece && puzzleImageUrl) {
            // Buscar la pieza en el patrón
            const patternPiece = currentPattern.find(
              (p) => p.id === currentPuzzlePiece.id
            );

            if (patternPiece) {
              // Validar colocación usando la función dedicada
              // Criterios: TODOS los bloques en Y=0 y posiciones X,Z correctas
              const validation = validatePuzzlePlacement(
                currentActiveWorldBlocks,
                patternPiece
              );

              if (validation.isValid) {
                // Pieza colocada correctamente en Y=0 con posición correcta - bloquear
                isPuzzleCorrectlyPlaced = true;
                puzzleActions.placePiece(currentPuzzlePiece.id);
                setLockedPieces((prev) =>
                  new Set(prev).add(currentPuzzlePiece.id)
                );

                // Sonido y shake de pieza colocada correctamente
                audioActions.playPieceLock();
                shake("pieceLock");

                // Verificar condición de victoria: TODAS las piezas del patrón colocadas correctamente
                // Usamos pattern.length porque es el número total de piezas requeridas
                const totalPieces = currentPattern.length;
                // placePiece() ya actualizó Zustand, así que placedPieces.length YA incluye esta pieza
                const placedCount = usePuzzleStore.getState().placedPieces.length;

                // Log colocación exitosa
                useGameLogStore.getState().addLog({
                  type: "place_success",
                  pieceId: currentPuzzlePiece.id,
                  pieceType: currentPuzzlePiece.type,
                  position: currentActiveWorldBlocks[0],
                  rotation: activeRotationRef.current,
                  patternRotation: patternPiece.rotation,
                  placedPieces: placedCount,
                  totalPieces: totalPieces,
                  remainingPieces: currentRemainingPieces.length - 1,
                });

                if (placedCount === totalPieces) {
                  // TODAS las piezas colocadas correctamente - VICTORIA
                  
                  // Calcular tiempo usado (usando ref para valor actualizado)
                  const currentTimeRemaining = timeRemainingRef.current;
                  const timeUsed = difficultyConfig.timeLimitSeconds - currentTimeRemaining;
                  
                  // Calcular puntuación final
                  const score = calculateScore(
                    levelDifficulty,
                    totalLinesClearedRef.current,
                    timeUsed,
                    difficultyConfig.timeLimitSeconds
                  );
                  setFinalScore(score);
                  
                  useGameLogStore.getState().addLog({
                    type: "victory",
                    placedPieces: placedCount,
                    totalPieces: totalPieces,
                    details: `Todas las piezas colocadas correctamente. Score: ${score.totalScore}`,
                  });
                  setGameState("victory");
                  audioActions.playVictory();
                  // Imprimir resumen del juego al finalizar
                  setTimeout(() => {
                    printFinalGameSummary();
                  }, 100);
                }
              } else {
                // Pieza puzzle fallida - se degrada a pieza normal
                // La pieza vuelve al final del pool para reintentarla más tarde
                // Los bloques se crearán como bloques normales (sin isPuzzleBlock)

                // Log colocación fallida
                useGameLogStore.getState().addLog({
                  type: "place_fail",
                  pieceId: currentPuzzlePiece.id,
                  pieceType: currentPuzzlePiece.type,
                  position: currentActiveWorldBlocks[0],
                  rotation: activeRotationRef.current,
                  patternRotation: patternPiece.rotation,
                  failReason: validation.reason,
                  remainingPieces: currentRemainingPieces.length,
                  totalPieces: currentPattern.length,
                  details: `Esperado: rot=${patternPiece.rotation}, cells=${JSON.stringify(patternPiece.cells)}`,
                });

                puzzleActions.discardPiece(currentPuzzlePiece.id);

                // Log discard/requeue
                useGameLogStore.getState().addLog({
                  type: "discard",
                  pieceId: currentPuzzlePiece.id,
                  remainingPieces: usePuzzleStore.getState().remainingPieces.length,
                  details: "Pieza devuelta al pool para reintentar",
                });
              }
            }
          }

          // Primero, crear el grid temporal para detectar líneas
          const tempGrid: Grid3D = currentGrid.map((plane) =>
            plane.map((row) => [...row])
          );
          currentActiveWorldBlocks.forEach((block) => {
            if (isInsideBounds(block.x, block.y, block.z)) {
              tempGrid[block.x][block.y][block.z] = "filled";
            }
          });

          // CORRECCIÓN BUG: Calcular lockedPositions con TODAS las celdas protegidas
          // Esto incluye piezas ya colocadas + la pieza recién colocada
          // Se calcula ANTES de llamar a processLineClearsIteratively para que el grid
          // no pierda las celdas de la pieza recién bloqueada
          const lockedPositions = new Set<string>();

          // Añadir celdas de piezas ya colocadas (usando IDs bloqueados)
          const currentLockedPieceIds = new Set(currentLockedPieces);
          if (isPuzzleCorrectlyPlaced && currentPuzzlePiece) {
            currentLockedPieceIds.add(currentPuzzlePiece.id);
          }

          currentPlacedPieces.forEach((piece) => {
            if (currentLockedPieceIds.has(piece.id)) {
              piece.cells.forEach((c) => {
                lockedPositions.add(`${c.x},${c.z}`);
              });
            }
          });

          // Añadir celdas de la pieza recién colocada (si aplica)
          // Esto es CRUCIAL porque placedPieces aún no incluye esta pieza
          // (Zustand actualiza el estado pero el hook no se ha re-renderizado)
          if (isPuzzleCorrectlyPlaced && currentPuzzlePiece) {
            const patternPiece = currentPattern.find(
              (p) => p.id === currentPuzzlePiece.id
            );
            patternPiece?.cells.forEach((c) => {
              lockedPositions.add(`${c.x},${c.z}`);
            });
          }

          // Procesar todas las líneas de forma iterativa
          // Ahora pasamos lockedPositions directamente (celdas x,z protegidas)
          const { blocksToRemove, blocksToMove, finalGrid } = !reachedLimit
            ? processLineClearsIteratively(tempGrid, lockedPositions)
            : {
                blocksToRemove: [] as { x: number; y: number; z: number }[],
                blocksToMove: [] as { x: number; y: number; z: number; newY: number }[],
                finalGrid: tempGrid,
              };

          // Sonido de destrucción de líneas y actualizar contador
          if (blocksToRemove.length > 0) {
            audioActions.playLineClear();
            // Incrementar contador de líneas eliminadas
            // Estimamos líneas como bloques/size (una línea completa tiene 'size' bloques)
            const linesCount = Math.ceil(blocksToRemove.length / size);
            setTotalLinesCleared(prev => prev + linesCount);
          }

          // Crear mapa de celdas puzzle recién colocadas (si aplica)
          // Esto captura la info ANTES de setVisualBlocks para evitar problemas de timing
          const newPuzzleCells = new Map<
            string,
            { tileX: number; tileZ: number }
          >();
          if (isPuzzleCorrectlyPlaced && currentPuzzlePiece) {
            const patternPiece = currentPattern.find(
              (p) => p.id === currentPuzzlePiece.id
            );
            if (patternPiece) {
              patternPiece.cells.forEach((cell) => {
                newPuzzleCells.set(`${cell.x},${cell.z}`, {
                  tileX: cell.x,
                  tileZ: cell.z,
                });
              });
            }
          }

          // OPTIMIZACIÓN: Capturar el Map actualizado antes de setVisualBlocks
          // Obtener el estado actualizado de Zustand para placedPieces
          const currentPlacedPuzzleCellsMap = new Map<string, { tileX: number; tileZ: number }>();
          const updatedPlacedPiecesForMap = usePuzzleStore.getState().placedPieces;
          updatedPlacedPiecesForMap.forEach((piece) => {
            piece.cells.forEach((cell) => {
              currentPlacedPuzzleCellsMap.set(`${cell.x},${cell.z}`, {
                tileX: cell.x,
                tileZ: cell.z,
              });
            });
          });

          // Actualizar bloques visuales con animaciones
          // REFACTORIZADO: Usar Map por posición exacta para mantener identidad de bloques
          setVisualBlocks((prev) => {
            // Crear Map de bloques existentes por posición exacta (x,y,z)
            const blocksByPosition = new Map<string, VisualBlock>();
            prev.forEach((vb) => {
              if (!vb.destroying) {
                const key = `${vb.targetX},${vb.targetY},${vb.targetZ}`;
                blocksByPosition.set(key, vb);
              }
            });

            // Mantener bloques que ya están en animación de destrucción
            const destroyingBlocks = prev.filter((vb) => vb.destroying);

            // Función optimizada para obtener info de tile puzzle
            const getPuzzleTileInfo = (
              blockX: number,
              blockZ: number
            ): { isPuzzle: boolean; tileX: number; tileZ: number } => {
              const key = `${blockX},${blockZ}`;
              // Primero verificar celdas recién colocadas
              const newCell = newPuzzleCells.get(key);
              if (newCell) {
                return {
                  isPuzzle: true,
                  tileX: newCell.tileX,
                  tileZ: newCell.tileZ,
                };
              }
              // Luego verificar Map de piezas ya colocadas (O(1) lookup)
              const placedCell = currentPlacedPuzzleCellsMap.get(key);
              if (placedCell) {
                return {
                  isPuzzle: true,
                  tileX: placedCell.tileX,
                  tileZ: placedCell.tileZ,
                };
              }
              return { isPuzzle: false, tileX: 0, tileZ: 0 };
            };

            const resultBlocks: VisualBlock[] = [];
            const processedPositions = new Set<string>();

            // Paso 1: Procesar bloques a eliminar (marcar como destroying)
            blocksToRemove.forEach((r) => {
              const posKey = `${r.x},${r.y},${r.z}`;
              const existing = blocksByPosition.get(posKey);
              if (existing) {
                resultBlocks.push({
                  ...existing,
                  targetScale: 0,
                  destroying: true,
                });
                processedPositions.add(posKey);
              }
            });

            // Paso 2: Procesar bloques que deben moverse (actualizar targetY)
            blocksToMove.forEach((m) => {
              const oldPosKey = `${m.x},${m.y},${m.z}`;
              const existing = blocksByPosition.get(oldPosKey);
              if (existing && !processedPositions.has(oldPosKey)) {
                const newY = m.newY;
                const puzzleInfo =
                  newY === 0
                    ? getPuzzleTileInfo(m.x, m.z)
                    : { isPuzzle: false, tileX: 0, tileZ: 0 };

                resultBlocks.push({
                  ...existing,
                  // Mantener posición visual actual para animación suave
                  x: existing.x,
                  y: existing.y,
                  z: existing.z,
                  // Actualizar posición destino
                  targetX: m.x,
                  targetY: newY,
                  targetZ: m.z,
                  targetScale: 1,
                  destroying: false,
                  variantParams: getBlockVariantParams(newY),
                  // Actualizar info de puzzle según nueva posición
                  isPuzzleBlock:
                    newY === 0 && (existing.isPuzzleBlock || puzzleInfo.isPuzzle),
                  puzzleTileX:
                    newY === 0
                      ? existing.puzzleTileX ??
                        (puzzleInfo.isPuzzle ? puzzleInfo.tileX : undefined)
                      : undefined,
                  puzzleTileZ:
                    newY === 0
                      ? existing.puzzleTileZ ??
                        (puzzleInfo.isPuzzle ? puzzleInfo.tileZ : undefined)
                      : undefined,
                });
                processedPositions.add(oldPosKey);
                // FIX: Marcar también la posición NUEVA para evitar crear bloques duplicados
                const newPosKey = `${m.x},${newY},${m.z}`;
                processedPositions.add(newPosKey);
              }
            });

            // Paso 3: Regenerar bloques desde finalGrid
            // Solo crear/actualizar bloques para celdas ocupadas
            for (let x = 0; x < size; x++) {
              for (let y = 0; y < MAX_STACK_HEIGHT; y++) {
                for (let z = 0; z < size; z++) {
                  if (finalGrid[x][y][z] !== "filled") continue;

                  const posKey = `${x},${y},${z}`;
                  
                  // Si ya fue procesado (eliminado o movido), saltar
                  if (processedPositions.has(posKey)) continue;

                  // Verificar si hay un bloque existente en esta posición
                  const existing = blocksByPosition.get(posKey);
                  const puzzleInfo =
                    y === 0
                      ? getPuzzleTileInfo(x, z)
                      : { isPuzzle: false, tileX: 0, tileZ: 0 };

                  if (existing) {
                    // Bloque existente que permanece en su posición
                    resultBlocks.push({
                      ...existing,
                      targetX: x,
                      targetY: y,
                      targetZ: z,
                      targetScale: 1,
                      destroying: false,
                      variantParams: getBlockVariantParams(y),
                      isPuzzleBlock:
                        y === 0 && (existing.isPuzzleBlock || puzzleInfo.isPuzzle),
                      puzzleTileX:
                        y === 0
                          ? existing.puzzleTileX ??
                            (puzzleInfo.isPuzzle ? puzzleInfo.tileX : undefined)
                          : undefined,
                      puzzleTileZ:
                        y === 0
                          ? existing.puzzleTileZ ??
                            (puzzleInfo.isPuzzle ? puzzleInfo.tileZ : undefined)
                          : undefined,
                    });
                  } else {
                    // Crear nuevo bloque con animación de entrada (scale: 0 -> 1)
                    resultBlocks.push({
                      id: generateBlockId(),
                      x,
                      y,
                      z,
                      targetX: x,
                      targetY: y,
                      targetZ: z,
                      scale: 0, // CORRECCIÓN: Empezar con scale 0 para animación de entrada
                      targetScale: 1,
                      destroying: false,
                      variantParams: getBlockVariantParams(y),
                      isPuzzleBlock: y === 0 && puzzleInfo.isPuzzle,
                      puzzleTileX:
                        y === 0 && puzzleInfo.isPuzzle ? puzzleInfo.tileX : undefined,
                      puzzleTileZ:
                        y === 0 && puzzleInfo.isPuzzle ? puzzleInfo.tileZ : undefined,
                    });
                  }
                  processedPositions.add(posKey);
                }
              }
            }


            return [...destroyingBlocks, ...resultBlocks];
          });

          // Actualizar grid lógico final
          setGrid(finalGrid);

          if (reachedLimit) {
            // Log gameover
            useGameLogStore.getState().addLog({
              type: "gameover",
              placedPieces: usePuzzleStore.getState().placedPieces.length,
              totalPieces: currentPattern.length,
              details: `Límite de altura alcanzado (MAX_STACK_HEIGHT=${MAX_STACK_HEIGHT})`,
            });
            setIsGameOver(true);
            setGameState("gameover");
            audioActions.playGameOver();
            // Imprimir resumen del juego al finalizar
            setTimeout(() => {
              printFinalGameSummary();
            }, 100);
            return;
          }

          // SISTEMA DE COLA: La pieza actual viene de nextPiece (la que estaba en preview)
          puzzleActions.incrementPieceCounter();

          // Obtener estado actualizado
          const updatedPlacedPieces = usePuzzleStore.getState().placedPieces;
          const updatedRemainingPieces = usePuzzleStore.getState().remainingPieces;
          const updatedTestMode = usePuzzleStore.getState().testMode;
          // Obtener posición actual del ciclo y target de normales
          const currentCyclePos = cyclePositionRef.current;
          const normalTarget = currentNormalTargetRef.current;

          const placedPieceIds = new Set(updatedPlacedPieces.map((p) => p.id));
          const availablePuzzlePieces = updatedRemainingPieces.filter(
            (p) => !currentLockedPieces.has(p.id) && !placedPieceIds.has(p.id)
          );

          const spawnPosition = {
            x: Math.floor(size / 2) - 1,
            y: size - 1,
            z: Math.floor(size / 2) - 1,
          };

          // Leer la pieza que estaba en el preview (nextPiece del ref)
          const queuedPiece = nextPieceRef.current;

          // USAR la pieza de la cola como pieza actual
          if (queuedPiece) {
            // La pieza viene de la cola (preview)
            if (queuedPiece.isPuzzle && queuedPiece.puzzleCells) {
              // Buscar la pieza puzzle correspondiente en availablePuzzlePieces
              const matchingPuzzle = availablePuzzlePieces.find(
                (p) => p.type === queuedPiece.type && p.rotation === queuedPiece.rotation
              );
              
              if (matchingPuzzle) {
                puzzleActions.setCurrentPuzzlePiece(matchingPuzzle);
                setActiveType(queuedPiece.type);
                setActiveRotation(queuedPiece.rotation);
                setActivePosition(spawnPosition);

                useGameLogStore.getState().addLog({
                  type: "spawn",
                  pieceId: matchingPuzzle.id,
                  pieceType: matchingPuzzle.type,
                  position: spawnPosition,
                  rotation: matchingPuzzle.rotation,
                  patternRotation: matchingPuzzle.rotation,
                  remainingPieces: updatedRemainingPieces.length,
                  totalPieces: currentPattern.length,
                  details: `Spawn pieza puzzle (desde cola, cyclePos=${currentCyclePos})`,
                });
              } else {
                // Puzzle no encontrado, usar como pieza normal
                puzzleActions.setCurrentPuzzlePiece(null);
                setActiveType(queuedPiece.type);
                setActiveRotation(queuedPiece.rotation);
                setActivePosition(spawnPosition);
              }
            } else {
              // Pieza normal de la cola
              puzzleActions.setCurrentPuzzlePiece(null);
              setActiveType(queuedPiece.type);
              setActiveRotation(queuedPiece.rotation);
              setActivePosition(spawnPosition);
            }
          } else {
            // No hay pieza en cola (primera vez) - usar sistema de ciclos
            const currentShouldBePuzzle = updatedTestMode
              ? availablePuzzlePieces.length > 0
              : shouldPositionBePuzzle(currentCyclePos, normalTarget) && availablePuzzlePieces.length > 0;

            if (puzzleImageUrl && currentShouldBePuzzle && availablePuzzlePieces.length > 0) {
              const puzzlePiece = availablePuzzlePieces[Math.floor(Math.random() * availablePuzzlePieces.length)];
              if (puzzlePiece) {
                puzzleActions.setCurrentPuzzlePiece(puzzlePiece);
                setActiveType(puzzlePiece.type);
                setActiveRotation(puzzlePiece.rotation);
                setActivePosition(spawnPosition);
              }
            } else {
              puzzleActions.setCurrentPuzzlePiece(null);
              const types: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
              setActiveType(types[Math.floor(Math.random() * types.length)] ?? "I");
              setActiveRotation(0);
              setActivePosition(spawnPosition);
            }
          }

          // INCREMENTAR posición del ciclo
          const nextCyclePos = currentCyclePos + 1;
          
          // Calcular longitud del ciclo para detectar reinicio
          const puzzleCount = getPuzzlePiecesCount(levelDifficulty);
          const cycleLength = puzzleCount + normalTarget;
          
          // Si completamos un ciclo, generar nuevo target aleatorio para las normales
          let nextNormalTarget = normalTarget;
          if (nextCyclePos % cycleLength === 0) {
            nextNormalTarget = getNormalPiecesCount(levelDifficulty);
            setCurrentNormalTarget(nextNormalTarget);
          }
          
          setCyclePosition(nextCyclePos);
          
          // SISTEMA DE PIEZA DE AYUDA 1x1
          // Actualizar contador de piezas normales consecutivas
          const currentConsecutiveCount = consecutiveNormalCountRef.current;
          const currentPieceWasPuzzle = queuedPiece?.isPuzzle ?? false;
          
          let newConsecutiveCount: number;
          if (currentPieceWasPuzzle) {
            // La pieza actual fue puzzle, resetear contador
            newConsecutiveCount = 0;
          } else {
            // La pieza actual fue normal, incrementar contador
            newConsecutiveCount = currentConsecutiveCount + 1;
          }
          
          // Verificar si la siguiente pieza debe ser de ayuda (O1)
          const shouldNextBeHelper = newConsecutiveCount >= NORMAL_PIECES_FOR_HELPER;
          
          if (shouldNextBeHelper) {
            // Generar pieza de ayuda O1 (1x1)
            setNextPiece({ type: "O1", rotation: 0, isPuzzle: false });
            setConsecutiveNormalCount(0); // Resetear contador
          } else {
            // Lógica normal de generación de pieza
            setConsecutiveNormalCount(newConsecutiveCount);
            
            // Determinar si la siguiente pieza (para el preview) debe ser puzzle
            const nextShouldBePuzzle = updatedTestMode
              ? availablePuzzlePieces.length > 0
              : shouldPositionBePuzzle(nextCyclePos, nextNormalTarget) && availablePuzzlePieces.length > 0;

            // Excluir la pieza que acabamos de usar
            const availableForNext = queuedPiece?.isPuzzle
              ? availablePuzzlePieces.filter((p) => p.type !== queuedPiece.type || p.rotation !== queuedPiece.rotation)
              : availablePuzzlePieces;

            if (puzzleImageUrl && nextShouldBePuzzle && availableForNext.length > 0) {
              const nextPuzzle = availableForNext[Math.floor(Math.random() * availableForNext.length)];
              if (nextPuzzle) {
                setNextPiece({
                  type: nextPuzzle.type,
                  rotation: nextPuzzle.rotation,
                  isPuzzle: true,
                  puzzleCells: nextPuzzle.cells,
                });
              } else {
                const normalTypes: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
                setNextPiece({ type: normalTypes[Math.floor(Math.random() * normalTypes.length)] ?? "I", rotation: 0, isPuzzle: false });
              }
            } else {
              const normalTypes: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
              setNextPiece({ type: normalTypes[Math.floor(Math.random() * normalTypes.length)] ?? "I", rotation: 0, isPuzzle: false });
            }
          }

          // Programar siguiente tick antes de salir (necesario porque el return evita llegar al requestAnimationFrame del final)
          animationFrameId = requestAnimationFrame(tick);
          return;
          } catch (error) {
            // Capturar y loggear cualquier error en el proceso de colocación
            useGameLogStore.getState().addError("Error en proceso de colocación", error, "piecePlacement");
            useGameLogStore.getState().addLog({
              type: "gameover",
              details: `Error interno: ${error instanceof Error ? error.message : String(error)}`,
            });
            // Intentar continuar el juego programando el siguiente tick
            animationFrameId = requestAnimationFrame(tick);
            return;
          }
        }

        setActivePosition(nextPosition);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
    // OPTIMIZACIÓN: Solo dependencias estables - el tick usa refs para valores que cambian frecuentemente
    // puzzleActions es estable (getState()) y no necesita estar en dependencias
    // placedPuzzleCellsMap se obtiene directamente de Zustand dentro del tick, no necesita estar aquí
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    size,
    cycleTime,
    puzzleImageUrl,
    isGameOver,
    gameState,
    isInsideBounds,
    processLineClearsIteratively,
    getBlockVariantParams,
  ]);

  // Función reutilizable para mover la pieza
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
        // Sonido sutil de movimiento
        audioActions.playMove();
      } else {
        // Colisión con muro - sonido y shake
        audioActions.playWallHit();
        shake("wallHit");
      }
    },
    [activePosition, activeShape, checkCollision, shake]
  );

  // Función reutilizable para rotar la pieza
  const tryRotate = useCallback(
    (delta: number) => {
      // Las piezas puzzle ahora pueden rotar
      // Si la orientación es incorrecta, se mostrarán como pieza normal (feedback visual)

      const nextRotation = (activeRotation + delta + 4) % 4;
      const baseShape = TETROMINO_SHAPES[activeType];
      const nextShape = rotateShapeHorizontal(baseShape, nextRotation);

      // Calcular posiciones mundo actuales de los bloques
      const currentWorldBlocks = activeShape.map((cell) => ({
        x: activePosition.x + cell.x,
        y: activePosition.y + cell.y,
        z: activePosition.z + cell.z,
      }));

      // Usar el bloque del medio como pivot (mismo enfoque que el repo original)
      const pivotIndex = Math.floor(currentWorldBlocks.length / 2);
      const pivot = currentWorldBlocks[pivotIndex];

      // Rotar cada bloque alrededor del pivot en el plano XZ
      const rotatedWorldBlocks = currentWorldBlocks.map((block) => {
        const relX = block.x - pivot.x;
        const relZ = block.z - pivot.z;

        return {
          x: pivot.x - relZ,
          y: block.y,
          z: pivot.z + relX,
        };
      });

      const applyRotation = (worldBlocks: typeof rotatedWorldBlocks) => {
        const pivotWorld = worldBlocks[pivotIndex];
        const pivotCell = nextShape[pivotIndex];

        setActiveRotation(nextRotation);
        setActivePosition({
          x: pivotWorld.x - pivotCell.x,
          y: activePosition.y,
          z: pivotWorld.z - pivotCell.z,
        });

        // Log rotación si es pieza puzzle
        if (currentPuzzlePiece) {
          const patternPiece = pattern.find(
            (p) => p.id === currentPuzzlePiece.id
          );
          const isCorrect = patternPiece
            ? nextRotation === patternPiece.rotation
            : false;
          useGameLogStore.getState().addLog({
            type: "rotate",
            pieceId: currentPuzzlePiece.id,
            pieceType: currentPuzzlePiece.type,
            rotation: nextRotation,
            patternRotation: patternPiece?.rotation,
            isCorrectOrientation: isCorrect,
            details: isCorrect
              ? "Orientación correcta"
              : "Orientación incorrecta (se verá como pieza normal)",
          });
        }
      };

      if (!checkCollision(rotatedWorldBlocks)) {
        applyRotation(rotatedWorldBlocks);
        return;
      }

      // Si hay colisión, intentar wall-kicks con offsets
      const attemptWithOffset = (dx: number, dz: number) => {
        const offsetBlocks = rotatedWorldBlocks.map((block) => ({
          x: block.x + dx,
          y: block.y,
          z: block.z + dz,
        }));

        if (!checkCollision(offsetBlocks)) {
          applyRotation(offsetBlocks);
          return true;
        }
        return false;
      };

      // Generar lista completa de wall-kicks ordenados por distancia
      const maxOffset = 3;
      const kicks: Array<{ dx: number; dz: number; distance: number }> = [];

      for (let dx = -maxOffset; dx <= maxOffset; dx++) {
        for (let dz = -maxOffset; dz <= maxOffset; dz++) {
          if (dx === 0 && dz === 0) continue;
          const distance = Math.sqrt(dx * dx + dz * dz);
          kicks.push({ dx, dz, distance });
        }
      }

      kicks.sort((a, b) => a.distance - b.distance);

      for (const { dx, dz } of kicks) {
        if (attemptWithOffset(dx, dz)) return;
      }
    },
    [
      activeRotation,
      activeType,
      activeShape,
      activePosition,
      checkCollision,
      currentPuzzlePiece,
      pattern,
    ]
  );

  // Controles de movimiento y rotación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo permitir controles cuando el juego está en estado "playing"
      if (isGameOver || gameState !== "playing") {
        return;
      }
      const { key } = event;

      let action: string | null = null;

      switch (key) {
        case "ArrowLeft":
        case "h":
        case "a":
          if (event.shiftKey) {
            action = "camera_rotate_left";
          } else {
            action = cameraCorrection("left");
          }
          break;
        case "H":
          action = "camera_rotate_left";
          break;
        case "ArrowRight":
        case "l":
        case "d":
          if (event.shiftKey) {
            action = "camera_rotate_right";
          } else {
            action = cameraCorrection("right");
          }
          break;
        case "L":
          action = "camera_rotate_right";
          break;
        case "ArrowUp":
        case "k":
        case "w":
          action = cameraCorrection("up");
          break;
        case "ArrowDown":
        case "j":
        case "s":
          action = cameraCorrection("down");
          break;
        case "<":
        case ",":
          action = cameraCorrection("left");
          break;
        case ">":
        case ".":
          action = cameraCorrection("right");
          break;
        case "r":
        case "R":
          action = "rotate";
          break;
        case "e":
        case "E":
          action = "clear_upper_layers";
          break;
        case "g":
        case "G":
          if (testMode) {
            action = "test_win";
          }
          break;
        case "p":
        case "P":
          if (testMode) {
            action = "test_lose";
          }
          break;
        case " ":
          setIsFastForward(true);
          event.preventDefault();
          return;
        default:
          break;
      }

      if (!action) return;

      event.preventDefault();

      switch (action) {
        case "left":
          // left/right controlan eje X del grid (como en el repo)
          tryMove(-1, 0, 0);
          break;
        case "right":
          // left/right controlan eje X del grid (como en el repo)
          tryMove(1, 0, 0);
          break;
        case "up":
          // up/down controlan eje Z del grid (como en el repo)
          tryMove(0, 0, -1);
          break;
        case "down":
          // up/down controlan eje Z del grid (como en el repo)
          tryMove(0, 0, 1);
          break;
        case "rotate":
          tryRotate(1);
          break;
        case "camera_rotate_left":
          rotateCameraView("left");
          break;
        case "camera_rotate_right":
          rotateCameraView("right");
          break;
        case "clear_upper_layers":
          clearAboveFloor();
          break;
        case "test_win":
          // Marcar todas las piezas restantes como colocadas
          const allRemainingPieces = usePuzzleStore.getState().remainingPieces;
          allRemainingPieces.forEach((piece) => {
            puzzleActions.placePiece(piece.id);
          });
          // Activar estado de victoria
          setGameState("victory");
          audioActions.playVictory();
          // Imprimir resumen del juego
          setTimeout(() => {
            printFinalGameSummary();
          }, 100);
          break;
        case "test_lose":
          // Activar estado de gameover
          setIsGameOver(true);
          setGameState("gameover");
          audioActions.playGameOver();
          // Imprimir resumen del juego
          setTimeout(() => {
            printFinalGameSummary();
          }, 100);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    tryMove,
    tryRotate,
    rotateCameraView,
    cameraCorrection,
    isGameOver,
    gameState,
    clearAboveFloor,
    testMode,
    puzzleActions,
    printFinalGameSummary,
  ]);

  // Handler para keyup de espacio (desactivar fastForward)
  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === " ") {
        setIsFastForward(false);
      }
    };

    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, []);

  // Handlers para controles móviles
  const handleMobileMove = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      switch (direction) {
        case "left":
          tryMove(-1, 0, 0);
          break;
        case "right":
          tryMove(1, 0, 0);
          break;
        case "up":
          tryMove(0, 0, -1);
          break;
        case "down":
          tryMove(0, 0, 1);
          break;
      }
    },
    [tryMove]
  );

  const handleMobileRotate = useCallback(() => {
    tryRotate(1);
  }, [tryRotate]);

  const handleFastForwardStart = useCallback(() => {
    setIsFastForward(true);
  }, []);

  const handleFastForwardEnd = useCallback(() => {
    setIsFastForward(false);
  }, []);

  const handleRotateCameraLeft = useCallback(() => {
    rotateCameraView("left");
  }, [rotateCameraView]);

  const handleRotateCameraRight = useCallback(() => {
    rotateCameraView("right");
  }, [rotateCameraView]);

  const handleClearLayers = useCallback(() => {
    clearAboveFloor();
  }, [clearAboveFloor]);

  // Actualizar cámara cuando cambie la configuración
  useEffect(() => {
    if (
      cameraRef.current &&
      cameraRef.current instanceof THREE.PerspectiveCamera
    ) {
      cameraRef.current.fov = cameraConfig.fov;
      cameraRef.current.zoom = cameraConfig.zoom;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [cameraConfig.fov, cameraConfig.zoom]);

  // Actualizar posición de cámara cuando cambien las posiciones
  useEffect(() => {
    if (cameraRef.current && targetPositionRef.current === null) {
      cameraRef.current.position.copy(cameraPositions[cameraViewIndex]);
      cameraRef.current.lookAt(new THREE.Vector3(0, 0, 0));
    }
  }, [cameraPositions, cameraViewIndex]);

  return (
    <div ref={gameContainerRef} className="relative h-full w-full bg-slate-950">
      {/* Barra superior izquierda - Controles */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        {/* Fila de botones */}
        <div className="flex gap-2">
          {/* Botón de volver a selección de niveles */}
          <button
            onClick={() => router.push("/game/levels")}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg border border-white/10"
            title="Volver a selección de niveles"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>

          {/* Botón de pantalla completa */}
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg border border-white/10"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? (
              <FiMinimize2 className="w-5 h-5" />
            ) : (
              <FiMaximize2 className="w-5 h-5" />
            )}
          </button>

          {/* Botón de mute/unmute */}
          <button
            onClick={toggleMute}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg border border-white/10"
            title={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? (
              <FiVolumeX className="w-5 h-5" />
            ) : (
              <FiVolume2 className="w-5 h-5" />
            )}
          </button>

          {/* Botón de configuración */}
          <CameraConfigPanel />

          {/* Contador de FPS */}
          <FpsCounter />
        </div>

        {/* Timer - debajo de los botones */}
        {gameState === "playing" && (
          <div className="px-4 py-2 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg flex items-center gap-2 w-fit">
            <FiClock className={`w-5 h-5 ${timeRemaining < 60 ? "text-red-400 animate-pulse" : "text-white"}`} />
            <span className={`font-mono text-lg font-bold ${timeRemaining < 60 ? "text-red-400 animate-pulse" : "text-white"}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Puntuación - esquina superior derecha */}
      {gameState === "playing" && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Puntos</div>
          <div className="font-mono text-2xl font-bold text-white">
            {totalLinesCleared * 100}
          </div>
        </div>
      )}

      {/* Contador de poder NOVA - lado izquierdo, mitad altura */}
      {gameState === "playing" && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 px-3 py-2 bg-black/70 backdrop-blur-sm border border-white/10 rounded-md text-center">
          <div className="text-xs text-cyan-400 font-bold tracking-wider">NOVA</div>
          <div className={`font-mono text-lg font-bold ${clearUsesRemaining > 0 ? "text-cyan-400" : "text-red-400"}`}>
            {clearUsesRemaining}/{difficultyConfig.clearCharges}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">[E]</div>
        </div>
      )}

      {/* Previsualizador de siguiente pieza - centrado arriba */}
      {gameState === "playing" && nextPiece && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
          <NextPiecePreview
            pieceType={nextPiece.type}
            rotation={nextPiece.rotation}
            isPuzzlePiece={nextPiece.isPuzzle}
            puzzleImageUrl={puzzleImageUrl}
            gridSize={size}
            puzzleCells={nextPiece.puzzleCells}
          />
        </div>
      )}

      {/* Pantalla de inicio - Botón "Iniciar Nivel" */}
      {gameState === "waiting" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-card px-10 py-8 shadow-2xl border">
            <h2 className="text-3xl font-bold text-card-foreground tracking-wide">
              {puzzleImageUrl ? "Modo Puzzle" : "Tetris 3D"}
            </h2>
            {puzzleImageUrl && (
              <p className="text-muted-foreground text-sm max-w-xs text-center">
                Coloca las piezas puzzle en su posición correcta para completar
                la imagen
              </p>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Iniciar Nivel
            </button>
          </div>
        </div>
      )}

      {/* Pantalla de Game Over - Botón "Reintentar" */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-card px-10 py-8 shadow-2xl border">
            <h2 className="text-3xl font-bold text-card-foreground tracking-wide">
              Game Over
            </h2>
            <p className="text-muted-foreground text-sm">
              La pila de bloques ha alcanzado el límite
            </p>
            <button
              onClick={restartGame}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Pantalla de Victoria - Puzzle completado */}
      {gameState === "victory" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-card px-10 py-8 shadow-2xl border min-w-[320px]">
            <Image
              src="/game/levels/trofeo.svg"
              alt="Trofeo"
              width={96}
              height={96}
              className="object-contain"
            />
            <h2 className="text-3xl font-bold text-card-foreground tracking-wide">
              ¡Puzzle Completado!
            </h2>
            
            {/* Desglose de puntuación */}
            {finalScore && (
              <div className="w-full space-y-2 bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Puntuación Base ({getDifficultyLabel(levelDifficulty)}):</span>
                  <span className="font-mono font-semibold">{finalScore.baseScore}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Líneas Eliminadas ({totalLinesCleared}):</span>
                  <span className="font-mono font-semibold">+{finalScore.linesClearedScore}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bonus de Tiempo:</span>
                  <span className="font-mono font-semibold text-green-500">+{finalScore.timeBonus}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary font-mono">{finalScore.totalScore}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={restartGame}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Jugar de Nuevo
              </button>
            </div>
          </div>
        </div>
      )}
      <Canvas
        camera={{
          fov: cameraConfig.fov,
          zoom: cameraConfig.zoom,
          near: 0.1,
          far: 1000,
          position: [size, size * 2, size],
        }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
          // Guardar posición base para el shake
          cameraBasePositionRef.current = cameraPositions[0].clone();
          // Posicionar cámara en la vista inicial (0)
          camera.position.copy(cameraPositions[0]);
          // lookAt al origen (0,0,0) donde está centrado el grid
          camera.lookAt(new THREE.Vector3(0, 0, 0));
        }}
      >
        {/* Controlador de Camera Shake */}
        <CameraShakeController
          shakeStateRef={shakeStateRef}
          offsetRef={offsetRef}
          cameraRef={cameraRef}
          basePositionRef={cameraBasePositionRef}
        />

        {/* Iluminación inspirada en el proyecto original */}
        <LightingRig />

        {/* Ejes de referencia X (rojo), Y (verde), Z (azul) */}
        <axesHelper args={[size * 1.2]} />

        {/* Paredes que se muestran/ocultan según la vista de cámara (como en el repo original) */}
        <group>
          {/* Suelo - siempre visible */}
          {puzzleImageUrl ? (
            <PuzzleFloor
              imageUrl={puzzleImageUrl}
              size={size}
              gridSize={size}
              position={[0, -halfSize, 0]}
            />
          ) : (
            <GridPlane
              width={size}
              height={size}
              segments={size}
              position={[0, -halfSize, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              visible={true}
            />
          )}

          {/* Indicador de posición destino para piezas puzzle */}
          {/* Muestra dónde debe colocarse la pieza puzzle actual */}
          {/* Se oculta en dificultad Leyenda (showTargetIndicator: false) */}
          {difficultyConfig.showTargetIndicator &&
            currentPuzzlePiece &&
            puzzleImageUrl &&
            (() => {
              const patternPiece = pattern.find(
                (p) => p.id === currentPuzzlePiece?.id
              );
              if (!patternPiece) return null;

              return patternPiece.cells.map((cell, idx) => (
                <mesh
                  key={`target-${idx}`}
                  position={[
                    cell.x - halfSize + 0.5,
                    -halfSize + 0.02, // Justo encima del suelo
                    cell.z - halfSize + 0.5,
                  ]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  material={puzzleTargetMaterial}
                >
                  <planeGeometry args={[0.95, 0.95]} />
                </mesh>
              ));
            })()}

          {/* Pared izquierda (L) - visible en vistas 0 y 1 */}
          <GridPlane
            width={size}
            height={size}
            segments={size}
            position={[-halfSize, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            visible={cameraViewIndex === 0 || cameraViewIndex === 1}
          />

          {/* Pared trasera (B) - visible en vistas 0 y 3 */}
          <GridPlane
            width={size}
            height={size}
            segments={size}
            position={[0, 0, -halfSize]}
            rotation={[0, 0, 0]}
            visible={cameraViewIndex === 0 || cameraViewIndex === 3}
          />

          {/* Pared derecha (R) - visible en vistas 2 y 3 */}
          <GridPlane
            width={size}
            height={size}
            segments={size}
            position={[halfSize, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            visible={cameraViewIndex === 2 || cameraViewIndex === 3}
          />

          {/* Pared frontal (F) - visible en vistas 1 y 2 */}
          <GridPlane
            width={size}
            height={size}
            segments={size}
            position={[0, 0, halfSize]}
            rotation={[0, Math.PI, 0]}
            visible={cameraViewIndex === 1 || cameraViewIndex === 2}
          />

          {/* Piezas activas: cubos de la pieza actual */}
          {/* Si es pieza puzzle con orientación correcta, muestra tiles de imagen; si no, cubos blancos */}
          {activeWorldBlocks.map((block, index) => {
            // Si es una pieza puzzle y tenemos la imagen, verificar orientación
            if (currentPuzzlePiece && puzzleImageUrl) {
              const patternPiece = pattern.find(
                (p) => p.id === currentPuzzlePiece.id
              );

              // Solo mostrar tiles si la orientación es correcta (feedback visual)
              const isCorrectOrientation = patternPiece && activeRotation === patternPiece.rotation;

              if (isCorrectOrientation && index < patternPiece.cells.length) {
                const targetCell = patternPiece.cells[index];

                return (
                  <PuzzleTileCube
                    key={`active-puzzle-${index}`}
                    position={[
                      block.x - halfSize + 0.5,
                      block.y - halfSize + 0.5,
                      block.z - halfSize + 0.5,
                    ]}
                    imageUrl={puzzleImageUrl}
                    gridSize={size}
                    tileX={targetCell.x}
                    tileZ={targetCell.z}
                    scale={0.9}
                  />
                );
              }
            }

            // Pieza normal o puzzle con orientación incorrecta: cubo blanco con bordes
            return (
              <ActiveCube
                key={`active-${index}`}
                position={[
                  block.x - halfSize + 0.5,
                  block.y - halfSize + 0.5,
                  block.z - halfSize + 0.5,
                ]}
                variantParams={getActiveBlockVariantParams()}
              />
            );
          })}

          {/* Preview de caída (ghost) */}
          {dropPositionBlocks.map((block, index) => {
            // No mostrar si está en la misma posición que la pieza activa
            const isActive = activeWorldBlocks.some(
              (ab) => ab.x === block.x && ab.y === block.y && ab.z === block.z
            );
            if (isActive) return null;

            return (
              <mesh
                key={`ghost-${index}`}
                position={[
                  block.x - halfSize + 0.5,
                  block.y - halfSize + 0.5,
                  block.z - halfSize + 0.5,
                ]}
                material={ghostMaterial}
                geometry={SHARED_BOX_GEOMETRY}
              />
            );
          })}

          {/* Piezas apiladas - renderizadas con AnimatedCube o AnimatedPuzzleCube */}
          {visualBlocks.map((block) => {
            // Si es un bloque de puzzle y tenemos imagen, usar AnimatedPuzzleCube
            if (block.isPuzzleBlock && puzzleImageUrl) {
              return (
                <AnimatedPuzzleCube
                  key={block.id}
                  block={block}
                  halfSize={halfSize}
                  onDestroyed={handleBlockDestroyed}
                  imageUrl={puzzleImageUrl}
                  gridSize={size}
                />
              );
            }

            // Bloque normal
            return (
              <AnimatedCube
                key={block.id}
                block={block}
                halfSize={halfSize}
                onDestroyed={handleBlockDestroyed}
              />
            );
          })}
        </group>
      </Canvas>

      {/* Controles móviles */}
      <MobileControls
        onMove={handleMobileMove}
        onRotate={handleMobileRotate}
        onFastForwardStart={handleFastForwardStart}
        onFastForwardEnd={handleFastForwardEnd}
        onRotateCameraLeft={handleRotateCameraLeft}
        onRotateCameraRight={handleRotateCameraRight}
        onClearLayers={handleClearLayers}
        cameraViewIndex={cameraViewIndex}
        disabled={gameState !== "playing"}
      />
    </div>
  );
}
