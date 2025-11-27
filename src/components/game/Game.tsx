//import Scene from "./Scene";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
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
import { CameraConfigPanel } from "./CameraConfigPanel";

const MAX_STACK_HEIGHT = 5;
const INITIAL_CYCLE_TIME = 500;
const ACCELERATION_FACTOR = 15;

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

// Componente para bloques activos (blancos con bordes)
function ActiveCube({
  position,
  variantParams,
}: {
  position: [number, number, number];
  variantParams: CubeVariantParams;
}) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  if (!materialRef.current) {
    materialRef.current = createNoisyCubeMaterial(variantParams);
  }

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value =
        state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={variantParams.scale}>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={materialRef.current} attach="material" />
    </mesh>
  );
}

function AnimatedCube({ block, halfSize, onDestroyed }: AnimatedCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const positionRef = useRef(
    new THREE.Vector3(
      block.x - halfSize + 0.5,
      block.y - halfSize + 0.5,
      block.z - halfSize + 0.5
    )
  );
  const scaleRef = useRef(block.scale);
  const prevVariantParamsRef = useRef<CubeVariantParams | null>(null);

  // Crear o actualizar material cuando cambien los parámetros de variante
  if (
    !materialRef.current ||
    JSON.stringify(prevVariantParamsRef.current) !==
      JSON.stringify(block.variantParams)
  ) {
    materialRef.current = createNoisyCubeMaterial(block.variantParams);
    prevVariantParamsRef.current = block.variantParams;
  }

  useFrame((state) => {
    if (!meshRef.current) return;

    // Lerp posición (como en el proyecto original: 0.22)
    const targetPos = new THREE.Vector3(
      block.targetX - halfSize + 0.5,
      block.targetY - halfSize + 0.5,
      block.targetZ - halfSize + 0.5
    );
    positionRef.current.lerp(targetPos, 0.22);
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
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={materialRef.current} attach="material" />
    </mesh>
  );
}

interface GameProps {
  difficulty: GameDifficulty;
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

function GridPlane({
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
}

const LightingRig = () => (
  <>
    <color attach="background" args={["#1a1b26"]} />
    <ambientLight color="#ffffff" intensity={0.5} />
    <directionalLight color="#ffffff" intensity={0.8} position={[10, 15, 10]} />
  </>
);

export default function Game({ difficulty }: GameProps) {
  const size = getGridSizeByDifficulty(difficulty);
  const cameraConfig = useCameraConfigStore((state) => state.config);
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

  // Sistema de bloques visuales con animación
  const [visualBlocks, setVisualBlocks] = useState<VisualBlock[]>([]);
  const [cycleTime, setCycleTime] = useState(INITIAL_CYCLE_TIME);

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

  // Reiniciar grid y pieza al cambiar el tamaño (dificultad)
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
    setCycleTime(INITIAL_CYCLE_TIME);
    blockIdCounter = 0;
  }, [size]);

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
  const detectLineClears = useCallback(
    (
      gridToCheck: Grid3D,
      level: number
    ): {
      toRemove: { x: number; z: number }[];
      toMove: { x: number; z: number; fromY: number; toY: number }[];
    } => {
      const toRemove: { x: number; z: number }[] = [];
      const toMove: { x: number; z: number; fromY: number; toY: number }[] = [];

      if (level < 0 || level >= size) {
        return { toRemove, toMove };
      }

      // Verificar líneas Z (para cada X fijo)
      for (let x = 0; x < size; x++) {
        let zLineFull = true;
        for (let z = 0; z < size; z++) {
          if (gridToCheck[x][level][z] !== "filled") {
            zLineFull = false;
            break;
          }
        }
        if (zLineFull) {
          for (let z = 0; z < size; z++) {
            toRemove.push({ x, z });
            // Marcar bloques superiores para bajar
            for (let yy = level + 1; yy < size; yy++) {
              if (gridToCheck[x][yy][z] === "filled") {
                toMove.push({ x, z, fromY: yy, toY: yy - 1 });
              }
            }
          }
        }
      }

      // Verificar líneas X (para cada Z fijo)
      for (let z = 0; z < size; z++) {
        let xLineFull = true;
        for (let x = 0; x < size; x++) {
          if (gridToCheck[x][level][z] !== "filled") {
            xLineFull = false;
            break;
          }
        }
        if (xLineFull) {
          for (let x = 0; x < size; x++) {
            // Solo añadir si no está ya en toRemove
            if (!toRemove.some((r) => r.x === x && r.z === z)) {
              toRemove.push({ x, z });
            }
            // Marcar bloques superiores para bajar
            for (let yy = level + 1; yy < size; yy++) {
              if (gridToCheck[x][yy][z] === "filled") {
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
  const applyLineClearToGrid = useCallback(
    (gridToClean: Grid3D, level: number): Grid3D => {
      if (level < 0 || level >= size) {
        return gridToClean;
      }

      const shiftColumnDown = (x: number, z: number) => {
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
            if (gridToClean[x][level][z] !== "filled") {
              zLineFull = false;
              break;
            }
          }
          if (zLineFull) {
            for (let z = 0; z < size; z++) {
              shiftColumnDown(x, z);
            }
            changed = true;
          }
        }

        for (let z = 0; z < size; z++) {
          let xLineFull = true;
          for (let x = 0; x < size; x++) {
            if (gridToClean[x][level][z] !== "filled") {
              xLineFull = false;
              break;
            }
          }
          if (xLineFull) {
            for (let x = 0; x < size; x++) {
              shiftColumnDown(x, z);
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
      gridToProcess: Grid3D
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
          const { toRemove } = detectLineClears(workingGrid, level);

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
            workingGrid = applyLineClearToGrid(workingGrid, level);
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

  // Material de shader para mostrar solo bordes en los cubos ghost
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

  // Caída automática en eje Y
  useEffect(() => {
    if (isGameOver) {
      return;
    }

    const interval = setInterval(() => {
      const nextPosition = {
        x: activePosition.x,
        y: activePosition.y - 1,
        z: activePosition.z,
      };

      const nextBlocks = activeShape.map((cell) => ({
        x: nextPosition.x + cell.x,
        y: nextPosition.y + cell.y,
        z: nextPosition.z + cell.z,
      }));

      if (checkCollision(nextBlocks)) {
        // Fijar pieza en el grid en la posición actual
        const highestBlock = Math.max(
          ...activeWorldBlocks.map((block) => block.y)
        );
        const reachedLimit = highestBlock >= MAX_STACK_HEIGHT;

        // Crear bloques visuales para los nuevos bloques fijados
        const newVisualBlocks: VisualBlock[] = activeWorldBlocks
          .filter((block) => isInsideBounds(block.x, block.y, block.z))
          .map((block) => ({
            id: generateBlockId(),
            x: block.x,
            y: block.y,
            z: block.z,
            targetX: block.x,
            targetY: block.y,
            targetZ: block.z,
            scale: 1,
            targetScale: 1,
            destroying: false,
            variantParams: getBlockVariantParams(block.y),
          }));

        // Primero, crear el grid temporal para detectar líneas
        const tempGrid: Grid3D = grid.map((plane) =>
          plane.map((row) => [...row])
        );
        activeWorldBlocks.forEach((block) => {
          if (isInsideBounds(block.x, block.y, block.z)) {
            tempGrid[block.x][block.y][block.z] = "filled";
          }
        });

        // Procesar todas las líneas de forma iterativa
        const { blocksToRemove, blocksToMove, finalGrid } = !reachedLimit
          ? processLineClearsIteratively(tempGrid)
          : {
              blocksToRemove: [] as { x: number; y: number; z: number }[],
              blocksToMove: [] as {
                x: number;
                y: number;
                z: number;
                newY: number;
              }[],
              finalGrid: tempGrid,
            };

        // Actualizar bloques visuales con animaciones
        setVisualBlocks((prev) => {
          let updatedBlocks = [...prev, ...newVisualBlocks];

          // Primero, marcar bloques para eliminación
          updatedBlocks = updatedBlocks.map((vb) => {
            const shouldRemove = blocksToRemove.some(
              (r) =>
                r.x === vb.targetX && r.y === vb.targetY && r.z === vb.targetZ
            );
            if (shouldRemove) {
              return { ...vb, targetScale: 0, destroying: true };
            }
            return vb;
          });

          // Actualizar posiciones de bloques que deben bajar
          // La función processLineClearsIteratively ya calcula el newY final correcto
          // incluso si el bloque baja múltiples veces en cascada
          updatedBlocks = updatedBlocks.map((vb) => {
            if (vb.destroying) return vb;

            // Buscar si este bloque debe moverse
            // Buscar por posición lógica actual (y) que es la posición original antes de cualquier movimiento
            const moveInfo = blocksToMove.find(
              (m) => m.x === vb.targetX && m.y === vb.y && m.z === vb.targetZ
            );

            if (moveInfo) {
              // Actualizar posición real y objetivo para que el bloque sea elegible
              // para formar nuevas líneas en su nueva posición
              // Actualizar color basado en la nueva altura Y (como en el original)
              return {
                ...vb,
                y: moveInfo.newY,
                targetY: moveInfo.newY,
                variantParams: getBlockVariantParams(moveInfo.newY),
              };
            }
            return vb;
          });

          return updatedBlocks;
        });

        // Acelerar si se completaron líneas
        if (blocksToRemove.length > 0) {
          setCycleTime((prev) => Math.max(100, prev - ACCELERATION_FACTOR));
        }

        // Actualizar grid lógico final
        setGrid(finalGrid);

        if (reachedLimit) {
          setIsGameOver(true);
          return;
        }

        // Generar nueva pieza
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

        return;
      }

      setActivePosition(nextPosition);
    }, cycleTime);

    return () => clearInterval(interval);
  }, [
    activePosition,
    activeShape,
    activeWorldBlocks,
    size,
    checkCollision,
    isInsideBounds,
    processLineClearsIteratively,
    getBlockVariantParams,
    getActiveBlockVariantParams,
    isGameOver,
    grid,
    cycleTime,
  ]);

  // Controles de movimiento y rotación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGameOver) {
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
          action = "fall";
          break;
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
        case "fall":
          tryMove(0, -1, 0);
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
  ]);

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
    <div className="relative h-full w-full">
      <CameraConfigPanel />
      {isGameOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-2xl bg-black/70 px-6 py-4 text-2xl font-semibold text-red-300">
            Game Over
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
          <GridPlane
            width={size}
            height={size}
            segments={size}
            position={[0, -halfSize, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={true}
          />

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

          {/* Piezas activas: cubos de la pieza actual (blanco con bordes oscuros) */}
          {activeWorldBlocks.map((block, index) => (
            <ActiveCube
              key={`active-${index}`}
              position={[
                block.x - halfSize + 0.5,
                block.y - halfSize + 0.5,
                block.z - halfSize + 0.5,
              ]}
              variantParams={getActiveBlockVariantParams()}
            />
          ))}

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
              >
                <boxGeometry args={[1, 1, 1]} />
              </mesh>
            );
          })}

          {/* Piezas apiladas - renderizadas con AnimatedCube para animaciones */}
          {visualBlocks.map((block) => (
            <AnimatedCube
              key={block.id}
              block={block}
              halfSize={halfSize}
              onDestroyed={handleBlockDestroyed}
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
}
