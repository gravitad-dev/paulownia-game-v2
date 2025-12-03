"use client";

import { memo, useCallback } from "react";
import {
  FiArrowUp,
  FiArrowDown,
  FiArrowLeft,
  FiArrowRight,
  FiRotateCw,
  FiChevronsDown,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";

type Direction = "left" | "right" | "up" | "down";

interface MobileControlsProps {
  onMove: (direction: Direction) => void;
  onRotate: () => void;
  onFastForwardStart: () => void;
  onFastForwardEnd: () => void;
  onRotateCameraLeft: () => void;
  onRotateCameraRight: () => void;
  onClearLayers: () => void;
  cameraViewIndex: 0 | 1 | 2 | 3;
  disabled?: boolean;
}

// Función de corrección de cámara (misma lógica que en Game.tsx)
const cameraCorrection = (
  action: Direction,
  cameraViewIndex: 0 | 1 | 2 | 3
): Direction => {
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
};

// Botón de acción reutilizable
interface ActionButtonProps {
  onPress: () => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const ActionButton = memo(function ActionButton({
  onPress,
  onPressStart,
  onPressEnd,
  disabled,
  children,
  className = "",
}: ActionButtonProps) {
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (disabled) return;
      onPressStart?.();
    },
    [disabled, onPressStart]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (disabled) return;
      onPressEnd?.();
      if (!onPressStart) {
        onPress();
      }
    },
    [disabled, onPress, onPressEnd, onPressStart]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (disabled) return;
      onPressStart?.();
    },
    [disabled, onPressStart]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (disabled) return;
      onPressEnd?.();
      if (!onPressStart) {
        onPress();
      }
    },
    [disabled, onPress, onPressEnd, onPressStart]
  );

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    onPressEnd?.();
  }, [disabled, onPressEnd]);

  return (
    <button
      type="button"
      className={`
        flex items-center justify-center
        w-14 h-14 sm:w-16 sm:h-16
        rounded-full
        bg-black/50 hover:bg-black/70 active:bg-black/80
        text-white
        backdrop-blur-sm
        transition-all duration-150
        active:scale-95
        shadow-lg
        border border-white/10
        disabled:opacity-40 disabled:pointer-events-none
        touch-none select-none
        ${className}
      `}
      disabled={disabled}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
});

// Botón direccional para la cruceta
interface DirectionalButtonProps {
  direction: Direction;
  onPress: () => void;
  disabled?: boolean;
}

const DirectionalButton = memo(function DirectionalButton({
  direction,
  onPress,
  disabled,
}: DirectionalButtonProps) {
  const icons: Record<Direction, React.ReactNode> = {
    up: <FiArrowUp className="w-6 h-6 sm:w-7 sm:h-7" />,
    down: <FiArrowDown className="w-6 h-6 sm:w-7 sm:h-7" />,
    left: <FiArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />,
    right: <FiArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />,
  };

  return (
    <ActionButton onPress={onPress} disabled={disabled}>
      {icons[direction]}
    </ActionButton>
  );
});

// Componente principal de controles móviles
const MobileControls = memo(function MobileControls({
  onMove,
  onRotate,
  onFastForwardStart,
  onFastForwardEnd,
  onRotateCameraLeft,
  onRotateCameraRight,
  onClearLayers,
  cameraViewIndex,
  disabled = false,
}: MobileControlsProps) {
  // Handlers para cada dirección con corrección de cámara
  const handleMove = useCallback(
    (direction: Direction) => {
      const correctedDirection = cameraCorrection(direction, cameraViewIndex);
      onMove(correctedDirection);
    },
    [cameraViewIndex, onMove]
  );

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-between items-end px-4 sm:px-8 pointer-events-none md:hidden">
      {/* Lado Izquierdo - Acciones */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        {/* Fila Superior - Botón Rotar Pieza (centrado) */}
        <div className="flex justify-center">
          <ActionButton onPress={onRotate} disabled={disabled}>
            <FiRotateCw className="w-6 h-6 sm:w-7 sm:h-7" />
          </ActionButton>
        </div>

        {/* Fila Media - Tres botones horizontales (Cámara Izq, Limpiar, Cámara Der) */}
        <div className="flex gap-2 justify-center items-center">
          <ActionButton
            onPress={onRotateCameraLeft}
            disabled={disabled}
            className="bg-blue-600/50 hover:bg-blue-600/70 active:bg-blue-600/80 w-12 h-12 sm:w-14 sm:h-14"
          >
            <FiRefreshCw className="w-5 h-5 sm:w-6 sm:h-6 -scale-x-100" />
          </ActionButton>
          <ActionButton
            onPress={onClearLayers}
            disabled={disabled}
            className="bg-red-600/50 hover:bg-red-600/70 active:bg-red-600/80 w-12 h-12 sm:w-14 sm:h-14"
          >
            <FiTrash2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </ActionButton>
          <ActionButton
            onPress={onRotateCameraRight}
            disabled={disabled}
            className="bg-blue-600/50 hover:bg-blue-600/70 active:bg-blue-600/80 w-12 h-12 sm:w-14 sm:h-14"
          >
            <FiRefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
          </ActionButton>
        </div>

        {/* Fila Inferior - Botón Bajar Rápido (centrado) */}
        <div className="flex justify-center">
          <ActionButton
            onPress={() => {}}
            onPressStart={onFastForwardStart}
            onPressEnd={onFastForwardEnd}
            disabled={disabled}
            className="bg-amber-600/50 hover:bg-amber-600/70 active:bg-amber-600/80"
          >
            <FiChevronsDown className="w-7 h-7 sm:w-8 sm:h-8" />
          </ActionButton>
        </div>
      </div>

      {/* Lado Derecho - Cruceta Direccional */}
      <div className="pointer-events-auto">
        <div className="grid grid-cols-3 gap-1">
          {/* Fila superior - Solo arriba */}
          <div /> {/* Espacio vacío */}
          <DirectionalButton
            direction="up"
            onPress={() => handleMove("up")}
            disabled={disabled}
          />
          <div /> {/* Espacio vacío */}

          {/* Fila media - Izquierda y Derecha */}
          <DirectionalButton
            direction="left"
            onPress={() => handleMove("left")}
            disabled={disabled}
          />
          <div /> {/* Centro vacío */}
          <DirectionalButton
            direction="right"
            onPress={() => handleMove("right")}
            disabled={disabled}
          />

          {/* Fila inferior - Solo abajo */}
          <div /> {/* Espacio vacío */}
          <DirectionalButton
            direction="down"
            onPress={() => handleMove("down")}
            disabled={disabled}
          />
          <div /> {/* Espacio vacío */}
        </div>
      </div>
    </div>
  );
});

export default MobileControls;

