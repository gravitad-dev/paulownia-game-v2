import { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

interface PuzzleFloorProps {
  imageUrl: string;
  size: number;
  gridSize: number;
  position: [number, number, number];
}

export function PuzzleFloor({
  imageUrl,
  size,
  gridSize,
  position,
}: PuzzleFloorProps) {
  // Cargar textura de la imagen
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  // Configurar textura base
  useMemo(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.flipY = false;
  }, [texture]);

  // Calcular tamaño de cada celda
  const cellSize = size / gridSize;

  // Crear celdas del puzzle
  const cells = useMemo(() => {
    return Array.from({ length: gridSize }, (_, x) =>
      Array.from({ length: gridSize }, (_, z) => {
        // Calcular posición de la celda
        const cellX = (x - gridSize / 2) * cellSize + cellSize / 2;
        const cellZ = (z - gridSize / 2) * cellSize + cellSize / 2;

        // Calcular UV mapping para mostrar solo la porción correspondiente de la imagen
        const uStart = x / gridSize;
        const vStart = 1 - (z + 1) / gridSize; // Invertir V porque la imagen se carga de arriba a abajo

        // Crear una textura clonada para esta celda con el offset correcto
        const cellTexture = texture.clone();
        cellTexture.offset.set(uStart, vStart);
        cellTexture.repeat.set(1 / gridSize, 1 / gridSize);

        return {
          key: `puzzle-cell-${x}-${z}`,
          x: cellX,
          z: cellZ,
          texture: cellTexture,
        };
      })
    ).flat();
  }, [texture, gridSize, cellSize]);

  return (
    <group position={position} rotation={[0, -Math.PI, 0]}>
      {cells.map((cell) => (
        <mesh
          key={cell.key}
          position={[cell.x, 0.01, cell.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[cellSize * 0.98, cellSize * 0.98]} />
          <meshStandardMaterial
            map={cell.texture}
            transparent={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

