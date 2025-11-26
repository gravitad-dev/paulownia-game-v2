//import Scene from "./Scene";
import { Canvas } from "@react-three/fiber";
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

interface GameProps {
  difficulty: GameDifficulty;
}

export default function Game({ difficulty }: GameProps) {
  const size = getGridSizeByDifficulty(difficulty);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const [cameraViewIndex, setCameraViewIndex] = useState<0 | 1 | 2 | 3>(0);
  const targetPositionRef = useRef<THREE.Vector3 | null>(null);
  const [grid, setGrid] = useState<Grid3D>(() => createEmptyGrid(size));
  const [activeType, setActiveType] = useState<TetrominoType>("I");
  const [activeRotation, setActiveRotation] = useState(0);
  const [activePosition, setActivePosition] = useState<{
    x: number;
    y: number;
    z: number;
  }>({
    x: Math.floor(size / 2),
    y: size - 1,
    z: 0,
  });

  // Reiniciar grid y pieza al cambiar el tamaño (dificultad)
  useEffect(() => {
    setGrid(createEmptyGrid(size));
    setActiveType("I");
    setActiveRotation(0);
    setActivePosition({
      x: Math.floor(size / 2),
      y: size - 1,
      z: 0,
    });
  }, [size]);

  const halfSize = size / 2;

  // 4 posiciones fijas de cámara (asimétricas para vista más frontal)
  const cameraPositions = useMemo(() => {
    const height = size * 2; // Altura igual al original (stage.width * 2)
    const offset = 5; // Offset para vista más frontal

    // Posiciones asimétricas con offset para vista más frontal (no tan diagonal)
    return [
      // Vista 0: Más frontal (X reducido por offset)
      new THREE.Vector3(size - offset, height, size),
      // Vista 1: Rotada 90°
      new THREE.Vector3(size, height, -size + offset),
      // Vista 2: Rotada 180°
      new THREE.Vector3(-size + offset, height, -size),
      // Vista 3: Rotada 270°
      new THREE.Vector3(-size, height, size - offset),
    ];
  }, [size]);

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
        setGrid((prev) => {
          const updated: Grid3D = prev.map((plane) =>
            plane.map((row) => [...row])
          );

          activeWorldBlocks.forEach((block) => {
            if (isInsideBounds(block.x, block.y, block.z)) {
              updated[block.x][block.y][block.z] = "filled";
            }
          });

          return updated;
        });

        // Generar nueva pieza
        const types: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
        const randomType =
          types[Math.floor(Math.random() * types.length)] ?? "I";

        const spawnPosition = {
          x: Math.floor(size / 2),
          y: size - 1,
          z: 0,
        };

        setActiveType(randomType);
        setActiveRotation(0);
        setActivePosition(spawnPosition);

        return;
      }

      setActivePosition(nextPosition);
    }, 800);

    return () => clearInterval(interval);
  }, [
    activePosition,
    activeShape,
    activeWorldBlocks,
    size,
    checkCollision,
    isInsideBounds,
  ]);

  // Controles de movimiento y rotación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

        const attemptWithOffset = (dx: number, dz: number) => {
          const nextBlocks = nextShape.map((cell) => ({
            x: activePosition.x + dx + cell.x,
            y: activePosition.y + cell.y,
            z: activePosition.z + dz + cell.z,
          }));

          if (!checkCollision(nextBlocks)) {
            setActiveRotation(nextRotation);
            setActivePosition((prev) => ({
              x: prev.x + dx,
              y: prev.y,
              z: prev.z + dz,
            }));
            return true;
          }
          return false;
        };

        // Intento directo
        if (attemptWithOffset(0, 0)) return;

        // Wall-kicks simples alrededor de paredes
        const kicks: Array<{ dx: number; dz: number }> = [
          { dx: 1, dz: 0 },
          { dx: -1, dz: 0 },
          { dx: 0, dz: 1 },
          { dx: 0, dz: -1 },
        ];

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
  ]);

  return (
    <Canvas
      camera={{
        fov: 120,
        zoom: 2.4,
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
      <ambientLight intensity={0.14} />
      <directionalLight position={[10, 15, 20]} color="white" intensity={1.1} />

      {/* Ejes de referencia X (rojo), Y (verde), Z (azul) */}
      <axesHelper args={[size * 1.2]} />

      {/* Paredes que se muestran/ocultan según la vista de cámara (como en el repo original) */}
      <group>
        {/* Suelo - siempre visible */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -halfSize, 0]}>
          <planeGeometry args={[size, size, size, size]} />
          <meshBasicMaterial
            color="#4b5563"
            wireframe
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Pared izquierda (L) - visible en vistas 0 y 1 */}
        {(cameraViewIndex === 0 || cameraViewIndex === 1) && (
          <mesh rotation={[0, Math.PI / 2, 0]} position={[-halfSize, 0, 0]}>
            <planeGeometry args={[size, size, size, size]} />
            <meshBasicMaterial
              color="#4b5563"
              wireframe
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Pared trasera (B) - visible en vistas 0 y 3 */}
        {(cameraViewIndex === 0 || cameraViewIndex === 3) && (
          <mesh rotation={[0, 0, 0]} position={[0, 0, -halfSize]}>
            <planeGeometry args={[size, size, size, size]} />
            <meshBasicMaterial
              color="#4b5563"
              wireframe
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Pared derecha (R) - visible en vistas 2 y 3 */}
        {(cameraViewIndex === 2 || cameraViewIndex === 3) && (
          <mesh rotation={[0, -Math.PI / 2, 0]} position={[halfSize, 0, 0]}>
            <planeGeometry args={[size, size, size, size]} />
            <meshBasicMaterial
              color="#4b5563"
              wireframe
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Pared frontal (F) - visible en vistas 1 y 2 */}
        {(cameraViewIndex === 1 || cameraViewIndex === 2) && (
          <mesh rotation={[0, Math.PI, 0]} position={[0, 0, halfSize]}>
            <planeGeometry args={[size, size, size, size]} />
            <meshBasicMaterial
              color="#4b5563"
              wireframe
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Piezas activas: cubos de la pieza actual */}
        {activeWorldBlocks.map((block, index) => (
          <mesh
            key={`active-${index}`}
            position={[
              block.x - halfSize + 0.5,
              block.y - halfSize + 0.5,
              block.z - halfSize + 0.5,
            ]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
        ))}

        {/* Piezas apiladas en el grid */}
        {grid.map((plane, x) =>
          plane.map((row, y) =>
            row.map((cell, z) => {
              if (cell !== "filled") return null;

              return (
                <mesh
                  key={`stacked-${x}-${y}-${z}`}
                  position={[
                    x - halfSize + 0.5,
                    y - halfSize + 0.5,
                    z - halfSize + 0.5,
                  ]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#6b7280" />
                </mesh>
              );
            })
          )
        )}
      </group>
    </Canvas>
  );
}
