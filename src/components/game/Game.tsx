//import Scene from "./Scene";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import * as THREE from "three";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import {
  createEmptyGrid,
  Grid3D,
  GameDifficulty,
  getGridSizeByDifficulty,
} from "@/lib/game/three/grid3d";
import {
  TetrominoType,
  TETROMINO_SHAPES,
  rotateShapeHorizontal,
} from "@/lib/game/three/tetrominoes";
import { useCameraConfigStore } from "@/store/useCameraConfigStore";
import { useGameSpeedStore } from "@/store/useGameSpeedStore";
import { usePuzzleStore } from "@/store/usePuzzleStore";
import { CameraConfigPanel } from "./CameraConfigPanel";
import { FpsCounter } from "./FpsCounter";
import { PuzzleFloor } from "./PuzzleFloor";
import { PuzzleTileCube } from "./PuzzleTileCube";
import { generatePuzzlePattern } from "@/lib/game/puzzleGenerator";
import { validatePuzzlePlacement } from "@/lib/game/puzzleValidation";

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
  difficulty: GameDifficulty;
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

export default function Game({ difficulty, puzzleImageUrl }: GameProps) {
  const size = getGridSizeByDifficulty(difficulty);
  const cameraConfig = useCameraConfigStore((state) => state.config);
  const cycleTime = useGameSpeedStore((state) => state.cycleTime);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const [cameraViewIndex, setCameraViewIndex] = useState<0 | 1 | 2 | 3>(0);
  const targetPositionRef = useRef<THREE.Vector3 | null>(null);
  const [grid, setGrid] = useState<Grid3D>(() => createEmptyGrid(size));
  const [activeType, setActiveType] = useState<TetrominoType>("I");
  const [activeRotation, setActiveRotation] = useState(0);
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

  // Toggle pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error al activar pantalla completa:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error("Error al salir de pantalla completa:", err);
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

  // Callback cuando un bloque termina de destruirse
  const handleBlockDestroyed = useCallback((id: number) => {
    setVisualBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

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
  }, [size, puzzleImageUrl]);

  // Función para iniciar el juego
  const startGame = useCallback(() => {
    // CORRECCIÓN BUG: Si hay puzzle y no hay pieza ya en progreso,
    // la primera pieza debe ser de puzzle (no una "I" normal)
    // Verificamos que no haya currentPuzzlePiece para evitar duplicación
    if (
      puzzleImageUrl &&
      remainingPieces.length > 0 &&
      !currentPuzzlePiece
    ) {
      // Filtrar para excluir piezas ya bloqueadas
      const availablePieces = remainingPieces.filter(
        (p) => !lockedPieces.has(p.id)
      );
      if (availablePieces.length > 0) {
        const firstPuzzlePiece = availablePieces[0];
        puzzleActions.setCurrentPuzzlePiece(firstPuzzlePiece);
        setActiveType(firstPuzzlePiece.type);
        setActiveRotation(firstPuzzlePiece.rotation);
        setActivePosition({
          x: Math.floor(size / 2) - 1,
          y: size - 1,
          z: Math.floor(size / 2) - 1,
        });
      }
    }
    setGameState("playing");
    lastTickTimeRef.current = performance.now();
  }, [puzzleImageUrl, remainingPieces, currentPuzzlePiece, size, lockedPieces, puzzleActions]);

  // Función para reiniciar el juego
  const restartGame = useCallback(() => {
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
  }, [size, puzzleImageUrl]);

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
            // No eliminar bloques bloqueados (pero sí los normales)
            if (!lockedPositions.has(`${x},${z}`)) {
              toRemove.push({ x, z });
            }
            // Marcar bloques superiores para bajar (excepto en columnas bloqueadas)
            for (let yy = level + 1; yy < size; yy++) {
              if (
                gridToCheck[x][yy][z] === "filled" &&
                !lockedPositions.has(`${x},${z}`)
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
            // Solo añadir si no está ya en toRemove y no está bloqueado
            if (
              !toRemove.some((r) => r.x === x && r.z === z) &&
              !lockedPositions.has(`${x},${z}`)
            ) {
              toRemove.push({ x, z });
            }
            // Marcar bloques superiores para bajar (excepto en columnas bloqueadas)
            for (let yy = level + 1; yy < size; yy++) {
              if (
                gridToCheck[x][yy][z] === "filled" &&
                !lockedPositions.has(`${x},${z}`)
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
  // Las piezas bloqueadas SÍ cuentan para completar líneas pero NO se mueven ni eliminan
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

      const shiftColumnDown = (x: number, z: number) => {
        // No mover bloques en posiciones bloqueadas
        if (lockedPositions.has(`${x},${z}`)) {
          return;
        }
        for (let yy = level; yy < size - 1; yy++) {
          gridToClean[x][yy][z] = gridToClean[x][yy + 1][z];
        }
        gridToClean[x][size - 1][z] = "empty";
      };

      let changed = true;
      while (changed) {
        changed = false;

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
              // Solo mover columnas no bloqueadas
              if (!lockedPositions.has(`${x},${z}`)) {
                shiftColumnDown(x, z);
              }
            }
            changed = true;
          }
        }

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
              // Solo mover columnas no bloqueadas
              if (!lockedPositions.has(`${x},${z}`)) {
                shiftColumnDown(x, z);
              }
            }
            changed = true;
          }
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
  const gridRef = useRef(grid);
  const lockedPiecesRef = useRef(lockedPieces);
  const isFastForwardRef = useRef(isFastForward);
  const currentPuzzlePieceRef = useRef(currentPuzzlePiece);
  const patternRef = useRef(pattern);
  const placedPiecesRef = useRef(placedPieces);
  const remainingPiecesRef = useRef(remainingPieces);
  const pieceCounterRef = useRef(pieceCounter);
  const testModeRef = useRef(testMode);

  // OPTIMIZACIÓN: Pool de objetos reutilizables para evitar GC
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _vectorPool = useRef({
    temp1: new THREE.Vector3(),
    temp2: new THREE.Vector3(),
    temp3: new THREE.Vector3(),
  });

  // Sincronizar refs con estado (sin causar re-renders)
  useEffect(() => {
    activePositionRef.current = activePosition;
  }, [activePosition]);
  useEffect(() => {
    activeShapeRef.current = activeShape;
  }, [activeShape]);
  useEffect(() => {
    activeWorldBlocksRef.current = activeWorldBlocks;
  }, [activeWorldBlocks]);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);
  useEffect(() => {
    lockedPiecesRef.current = lockedPieces;
  }, [lockedPieces]);
  useEffect(() => {
    isFastForwardRef.current = isFastForward;
  }, [isFastForward]);
  useEffect(() => {
    currentPuzzlePieceRef.current = currentPuzzlePiece;
  }, [currentPuzzlePiece]);
  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);
  useEffect(() => {
    placedPiecesRef.current = placedPieces;
  }, [placedPieces]);
  useEffect(() => {
    remainingPiecesRef.current = remainingPieces;
  }, [remainingPieces]);
  useEffect(() => {
    pieceCounterRef.current = pieceCounter;
  }, [pieceCounter]);
  useEffect(() => {
    testModeRef.current = testMode;
  }, [testMode]);

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

                // Verificar condición de victoria: todas las piezas puzzle colocadas
                // remainingPieces se actualiza dentro de placePiece, verificamos si queda solo esta
                if (currentRemainingPieces.length === 1) {
                  // Esta era la última pieza - VICTORIA
                  setGameState("victory");
                }
              } else {
                // Pieza puzzle fallida - se degrada a pieza normal
                // Se descarta de remainingPieces para evitar que se seleccione de nuevo
                // Los bloques se crearán como bloques normales (sin isPuzzleBlock)
                puzzleActions.discardPiece(currentPuzzlePiece.id);
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
          const { blocksToRemove, finalGrid } = !reachedLimit
            ? processLineClearsIteratively(tempGrid, lockedPositions)
            : {
                blocksToRemove: [] as { x: number; y: number; z: number }[],
                finalGrid: tempGrid,
              };

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
          setVisualBlocks((prev) => {
            const newBlocks: VisualBlock[] = [];
            const destroyingBlocks = prev.filter((vb) => vb.destroying);

            // Crear un set de posiciones que deben eliminarse
            const positionsToRemove = new Set<string>();
            blocksToRemove.forEach((r) => {
              positionsToRemove.add(`${r.x},${r.y},${r.z}`);
            });

            // Agrupar bloques existentes por columna (x, z) y ordenar por Y descendente
            const blocksByColumn = new Map<string, VisualBlock[]>();
            prev.forEach((vb) => {
              if (!vb.destroying) {
                const key = `${vb.targetX},${vb.targetZ}`;
                if (!blocksByColumn.has(key)) {
                  blocksByColumn.set(key, []);
                }
                blocksByColumn.get(key)!.push(vb);
              }
            });

            // Ordenar bloques en cada columna por Y descendente
            blocksByColumn.forEach((blocks) => {
              blocks.sort((a, b) => b.targetY - a.targetY);
            });

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
              // Usar el Map capturado del scope externo
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

            // Regenerar bloques desde finalGrid, asignando bloques existentes por columna
            for (let x = 0; x < size; x++) {
              for (let z = 0; z < size; z++) {
                const columnKey = `${x},${z}`;
                const columnBlocks = blocksByColumn.get(columnKey) || [];

                // Obtener posiciones Y ocupadas en esta columna (de arriba hacia abajo)
                const occupiedYs: number[] = [];
                for (let y = MAX_STACK_HEIGHT - 1; y >= 0; y--) {
                  if (finalGrid[x][y][z] === "filled") {
                    occupiedYs.push(y);
                  }
                }

                // Asignar bloques existentes a posiciones ocupadas
                for (let i = 0; i < occupiedYs.length; i++) {
                  const targetY = occupiedYs[i];
                  const positionKey = `${x},${targetY},${z}`;
                  const shouldRemove = positionsToRemove.has(positionKey);
                  // CORRECCIÓN BUG: Solo asignar isPuzzleBlock si el bloque está en Y=0 (nivel del suelo)
                  // Bloques apilados (Y > 0) NUNCA deben ser puzzle blocks, incluso si están en la misma columna X,Z
                  const puzzleInfo =
                    targetY === 0
                      ? getPuzzleTileInfo(x, z)
                      : { isPuzzle: false, tileX: 0, tileZ: 0 };

                  if (shouldRemove) {
                    // Marcar para eliminación
                    if (i < columnBlocks.length) {
                      const existing = columnBlocks[i];
                      newBlocks.push({
                        ...existing,
                        x,
                        y: targetY,
                        z,
                        targetX: x,
                        targetY: targetY,
                        targetZ: z,
                        targetScale: 0,
                        destroying: true,
                      });
                    }
                  } else {
                    // Bloque que permanece
                    if (i < columnBlocks.length) {
                      // Reutilizar bloque existente, mantener info de puzzle si ya la tenía
                      const existing = columnBlocks[i];
                      newBlocks.push({
                        ...existing,
                        x,
                        y: targetY,
                        z,
                        targetX: x,
                        targetY: targetY,
                        targetZ: z,
                        scale: existing.scale,
                        targetScale: 1,
                        destroying: false,
                        variantParams: getBlockVariantParams(targetY),
                        // CORRECCIÓN: Solo mantener isPuzzleBlock si targetY === 0
                        // Si un bloque se mueve a Y > 0, pierde su estatus de puzzle
                        isPuzzleBlock:
                          targetY === 0 &&
                          (existing.isPuzzleBlock || puzzleInfo.isPuzzle),
                        puzzleTileX:
                          targetY === 0
                            ? existing.puzzleTileX ??
                              (puzzleInfo.isPuzzle
                                ? puzzleInfo.tileX
                                : undefined)
                            : undefined,
                        puzzleTileZ:
                          targetY === 0
                            ? existing.puzzleTileZ ??
                              (puzzleInfo.isPuzzle
                                ? puzzleInfo.tileZ
                                : undefined)
                            : undefined,
                      });
                    } else {
                      // Crear nuevo bloque
                      newBlocks.push({
                        id: generateBlockId(),
                        x,
                        y: targetY,
                        z,
                        targetX: x,
                        targetY: targetY,
                        targetZ: z,
                        scale: 1,
                        targetScale: 1,
                        destroying: false,
                        variantParams: getBlockVariantParams(targetY),
                        // Solo asignar isPuzzleBlock si targetY === 0
                        isPuzzleBlock: targetY === 0 && puzzleInfo.isPuzzle,
                        puzzleTileX:
                          targetY === 0 && puzzleInfo.isPuzzle
                            ? puzzleInfo.tileX
                            : undefined,
                        puzzleTileZ:
                          targetY === 0 && puzzleInfo.isPuzzle
                            ? puzzleInfo.tileZ
                            : undefined,
                      });
                    }
                  }
                }
              }
            }

            return [...destroyingBlocks, ...newBlocks];
          });

          // Actualizar grid lógico final
          setGrid(finalGrid);

          if (reachedLimit) {
            setIsGameOver(true);
            setGameState("gameover");
            return;
          }

          // Generar nueva pieza
          puzzleActions.incrementPieceCounter();

          // CORRECCIÓN BUG: Filtrar piezas puzzle disponibles con múltiples verificaciones
          // 1. Excluir piezas ya bloqueadas (lockedPieces)
          // 2. Excluir la pieza actual (currentPuzzlePiece) para evitar duplicación
          // 3. Excluir piezas ya en placedPieces para mayor seguridad
          // OPTIMIZACIÓN: Usar refs para obtener valores actualizados
          const updatedPlacedPieces = usePuzzleStore.getState().placedPieces;
          const updatedRemainingPieces = usePuzzleStore.getState().remainingPieces;
          const updatedPieceCounter = usePuzzleStore.getState().pieceCounter;
          const updatedTestMode = usePuzzleStore.getState().testMode;
          const updatedCurrentPuzzlePiece = usePuzzleStore.getState().currentPuzzlePiece;

          const placedPieceIds = new Set(updatedPlacedPieces.map((p) => p.id));
          const availablePuzzlePieces = updatedRemainingPieces.filter(
            (p) =>
              !currentLockedPieces.has(p.id) &&
              p.id !== updatedCurrentPuzzlePiece?.id &&
              !placedPieceIds.has(p.id)
          );

          // Determinar si la siguiente pieza es puzzle:
          // - testMode=true: SIEMPRE puzzle si hay disponibles (para testing)
          // - testMode=false: cada 3 piezas, 1 puzzle (comportamiento normal)
          const shouldBePuzzlePiece = updatedTestMode
            ? availablePuzzlePieces.length > 0 // Test mode: siempre puzzle
            : updatedPieceCounter % 3 === 0 && availablePuzzlePieces.length > 0; // Normal: cada 3

          const isPuzzlePiece = puzzleImageUrl && shouldBePuzzlePiece;

          if (isPuzzlePiece) {
            // Seleccionar una pieza puzzle aleatoria de las disponibles
            const randomIndex = Math.floor(
              Math.random() * availablePuzzlePieces.length
            );
            const puzzlePiece = availablePuzzlePieces[randomIndex];

            puzzleActions.setCurrentPuzzlePiece(puzzlePiece);

            const spawnPosition = {
              x: Math.floor(size / 2) - 1,
              y: size - 1,
              z: Math.floor(size / 2) - 1,
            };

            setActiveType(puzzlePiece.type);
            setActiveRotation(puzzlePiece.rotation);
            setActivePosition(spawnPosition);
          } else {
            // Pieza normal (solo cuando testMode=false o no hay más puzzle pieces)
            puzzleActions.setCurrentPuzzlePiece(null);
            const types: TetrominoType[] = [
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
            const randomType =
              types[Math.floor(Math.random() * types.length)] ?? "I";

            const spawnPosition = {
              x: Math.floor(size / 2) - 1,
              y: size - 1,
              z: Math.floor(size / 2) - 1,
            };

            setActiveType(randomType);
            setActiveRotation(0);
            setActivePosition(spawnPosition);
          }

          // Programar siguiente tick antes de salir (necesario porque el return evita llegar al requestAnimationFrame del final)
          animationFrameId = requestAnimationFrame(tick);
          return;
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
    placedPuzzleCellsMap, // Map memoizado
  ]);

  // Controles de movimiento y rotación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo permitir controles cuando el juego está en estado "playing"
      if (isGameOver || gameState !== "playing") {
        return;
      }
      const { key } = event;

      const tryMove = (dx: number, dy: number, dz: number) => {
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
      };

      const tryRotate = (delta: number) => {
        // Si hay una pieza puzzle activa, no permitir rotación
        if (currentPuzzlePiece) {
          return;
        }

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
      };

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
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activePosition,
    activeRotation,
    activeShape,
    activeType,
    grid,
    size,
    checkCollision,
    rotateCameraView,
    cameraCorrection,
    isGameOver,
    gameState,
    currentPuzzlePiece,
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
      <CameraConfigPanel />
      <FpsCounter />

      {/* Botón flotante de pantalla completa */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 left-4 z-50 p-3 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg border border-white/10"
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? (
          <FiMinimize2 className="w-5 h-5" />
        ) : (
          <FiMaximize2 className="w-5 h-5" />
        )}
      </button>

      {/* Pantalla de inicio - Botón "Iniciar Nivel" */}
      {gameState === "waiting" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 px-10 py-8 shadow-2xl border border-slate-700">
            <h2 className="text-3xl font-bold text-white tracking-wide">
              {puzzleImageUrl ? "Modo Puzzle" : "Tetris 3D"}
            </h2>
            {puzzleImageUrl && (
              <p className="text-slate-400 text-sm max-w-xs text-center">
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
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 px-10 py-8 shadow-2xl border border-red-900/50">
            <h2 className="text-3xl font-bold text-red-400 tracking-wide">
              Game Over
            </h2>
            <p className="text-slate-400 text-sm">
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
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 px-10 py-8 shadow-2xl border border-emerald-500/50">
            <h2 className="text-3xl font-bold text-emerald-400 tracking-wide">
              ¡Puzzle Completado!
            </h2>
            <p className="text-slate-400 text-sm max-w-xs text-center">
              Has reconstruido la imagen correctamente
            </p>
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
          // Posicionar cámara en la vista inicial (0)
          camera.position.copy(cameraPositions[0]);
          // lookAt al origen (0,0,0) donde está centrado el grid
          camera.lookAt(new THREE.Vector3(0, 0, 0));
        }}
      >
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
          {currentPuzzlePiece &&
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
          {/* Si es pieza puzzle, muestra tiles de imagen; si no, cubos blancos con borde */}
          {activeWorldBlocks.map((block, index) => {
            // Si es una pieza puzzle y tenemos la imagen, mostrar con tile de imagen
            if (currentPuzzlePiece && puzzleImageUrl) {
              const patternPiece = pattern.find(
                (p) => p.id === currentPuzzlePiece.id
              );

              // El índice se mantiene estable durante la rotación (map preserva el orden)
              // Cada bloque siempre muestra su tile asignado, rotando junto con la pieza
              if (patternPiece && index < patternPiece.cells.length) {
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

            // Pieza normal: cubo blanco con bordes
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
    </div>
  );
}
