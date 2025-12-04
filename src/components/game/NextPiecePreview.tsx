"use client";

import { useRef, useMemo, Suspense, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  TetrominoType,
  TETROMINO_SHAPES,
  rotateShapeHorizontal,
} from "@/lib/game/three/tetrominoes";
import { ActiveCube } from "./ActiveCube";
import { PuzzleTileCube } from "./PuzzleTileCube";

interface NextPiecePreviewProps {
  pieceType: TetrominoType;
  rotation: number;
  // Props para piezas puzzle
  isPuzzlePiece?: boolean;
  puzzleImageUrl?: string;
  gridSize?: number;
  puzzleCells?: Array<{ x: number; z: number }>;
}

// ============================================================================
// OPTIMIZACIÓN: Componente interno que fuerza invalidación continua
// Solo se usa cuando el frameloop está en "demand"
// ============================================================================
function ContinuousInvalidator() {
  const { invalidate } = useThree();
  useFrame(() => {
    invalidate();
  });
  return null;
}

// Componente que contiene la pieza y rota
// OPTIMIZACIÓN: Memoizado para evitar re-renders innecesarios
const RotatingPiece = memo(function RotatingPiece({
  pieceType,
  rotation,
  isPuzzlePiece,
  puzzleImageUrl,
  gridSize,
  puzzleCells,
}: {
  pieceType: TetrominoType;
  rotation: number;
  isPuzzlePiece?: boolean;
  puzzleImageUrl?: string;
  gridSize?: number;
  puzzleCells?: Array<{ x: number; z: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Obtener la forma de la pieza con la rotación aplicada
  const shape = useMemo(() => {
    const baseShape = TETROMINO_SHAPES[pieceType];
    return rotateShapeHorizontal(baseShape, rotation);
  }, [pieceType, rotation]);

  // Calcular el centro de la pieza para centrarla en el origen
  const center = useMemo(() => {
    let sumX = 0,
      sumY = 0,
      sumZ = 0;
    shape.forEach((cell) => {
      sumX += cell.x;
      sumY += cell.y;
      sumZ += cell.z;
    });
    return {
      x: sumX / shape.length,
      y: sumY / shape.length,
      z: sumZ / shape.length,
    };
  }, [shape]);

  // OPTIMIZACIÓN: Rotación con velocidad reducida para menor carga de GPU
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5; // Reducido de 0.8 a 0.5
    }
  });

  // Determinar si es pieza puzzle con toda la info necesaria
  const showAsPuzzle =
    isPuzzlePiece &&
    puzzleImageUrl &&
    gridSize &&
    puzzleCells &&
    puzzleCells.length === shape.length;

  return (
    <group ref={groupRef}>
      {shape.map((cell, index) => {
        const position: [number, number, number] = [
          cell.x - center.x,
          cell.y - center.y,
          cell.z - center.z,
        ];

        // Si es pieza puzzle, usar PuzzleTileCube
        if (showAsPuzzle && puzzleCells) {
          const puzzleCell = puzzleCells[index];
          return (
            <PuzzleTileCube
              key={index}
              position={position}
              imageUrl={puzzleImageUrl!}
              gridSize={gridSize!}
              tileX={puzzleCell.x}
              tileZ={puzzleCell.z}
              scale={0.9}
            />
          );
        }

        // Pieza normal: usar ActiveCube (cubo blanco con bordes)
        return <ActiveCube key={index} position={position} />;
      })}
    </group>
  );
});

// OPTIMIZACIÓN: Componente principal memoizado
export const NextPiecePreview = memo(function NextPiecePreview({
  pieceType,
  rotation,
  isPuzzlePiece,
  puzzleImageUrl,
  gridSize,
  puzzleCells,
}: NextPiecePreviewProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">
        Siguiente
      </span>
      <div className="relative bg-black/40 rounded-lg border border-white/10 backdrop-blur-sm overflow-hidden">
        <Canvas
          style={{ width: 100, height: 100 }}
          camera={{
            position: [3, 3, 3],
            fov: 50,
            near: 0.1,
            far: 100,
          }}
          gl={{ 
            alpha: true, 
            antialias: false, // OPTIMIZACIÓN: Desactivar antialiasing en preview pequeño
            powerPreference: "low-power", // OPTIMIZACIÓN: Preferir bajo consumo
          }}
          frameloop="demand" // OPTIMIZACIÓN: Solo renderizar cuando hay cambios
        >
          {/* OPTIMIZACIÓN: Fuerza renderizado continuo para la animación */}
          <ContinuousInvalidator />
          
          {/* Fondo transparente */}
          <color attach="background" args={["transparent"]} />

          {/* Iluminación similar al juego */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 15, 10]} intensity={0.8} />

          {/* La pieza rotando */}
          <Suspense fallback={null}>
            <RotatingPiece
              pieceType={pieceType}
              rotation={rotation}
              isPuzzlePiece={isPuzzlePiece}
              puzzleImageUrl={puzzleImageUrl}
              gridSize={gridSize}
              puzzleCells={puzzleCells}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
});
