import { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Tipo de shake disponible
export type ShakeType = "wallHit" | "pieceLock";

// Configuración de intensidad por tipo
const SHAKE_CONFIGS: Record<
  ShakeType,
  { intensity: number; duration: number }
> = {
  wallHit: {
    intensity: 0.015, // Muy sutil
    duration: 100, // ms
  },
  pieceLock: {
    intensity: 0.03, // Sutil pero notorio
    duration: 180, // ms
  },
};

interface CameraShakeState {
  isShaking: boolean;
  startTime: number;
  intensity: number;
  duration: number;
}

/**
 * Hook para controlar el shake de cámara.
 * Debe usarse dentro de un componente que esté dentro del Canvas de R3F.
 */
export function useCameraShake() {
  const shakeStateRef = useRef<CameraShakeState>({
    isShaking: false,
    startTime: 0,
    intensity: 0,
    duration: 0,
  });

  // Offset actual del shake
  const offsetRef = useRef(new THREE.Vector3(0, 0, 0));

  /**
   * Inicia un shake de cámara
   */
  const shake = useCallback((type: ShakeType = "wallHit") => {
    const config = SHAKE_CONFIGS[type];
    shakeStateRef.current = {
      isShaking: true,
      startTime: performance.now(),
      intensity: config.intensity,
      duration: config.duration,
    };
  }, []);

  /**
   * Obtiene el offset actual del shake (para aplicar a la cámara)
   */
  const getOffset = useCallback(() => offsetRef.current, []);

  return { shake, getOffset, shakeStateRef, offsetRef };
}

/**
 * Componente que aplica el shake a la cámara.
 * Debe renderizarse dentro del Canvas de R3F.
 */
interface CameraShakeControllerProps {
  shakeStateRef: React.MutableRefObject<CameraShakeState>;
  offsetRef: React.MutableRefObject<THREE.Vector3>;
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  basePositionRef: React.MutableRefObject<THREE.Vector3 | null>;
}

export function CameraShakeController({
  shakeStateRef,
  offsetRef,
  cameraRef,
}: CameraShakeControllerProps) {
  // Vector temporal para evitar crear objetos en cada frame
  const tempOffset = useRef(new THREE.Vector3());
  const zeroVector = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const state = shakeStateRef.current;
    const camera = cameraRef.current;

    if (!camera) return;

    if (state.isShaking) {
      const elapsed = performance.now() - state.startTime;
      const progress = elapsed / state.duration;

      if (progress >= 1) {
        // Shake terminado - resetear offset
        state.isShaking = false;
        offsetRef.current.set(0, 0, 0);
      } else {
        // Calcular decay exponencial
        const decay = 1 - progress;
        const currentIntensity = state.intensity * decay;

        // Calcular nuevo offset aleatorio
        tempOffset.current.set(
          (Math.random() - 0.5) * 2 * currentIntensity,
          (Math.random() - 0.5) * 2 * currentIntensity,
          (Math.random() - 0.5) * 2 * currentIntensity
        );

        // Suavizar la transición del offset
        offsetRef.current.lerp(tempOffset.current, 0.5);
      }
    } else if (offsetRef.current.lengthSq() > 0.0001) {
      // Sin shake pero hay offset residual - lerp suave hacia 0
      offsetRef.current.lerp(zeroVector.current, 0.3);
    }

    // Aplicar offset a la cámara (sumado a su posición actual)
    // El offset se aplica como perturbación temporal
    if (offsetRef.current.lengthSq() > 0.0001) {
      camera.position.add(offsetRef.current);
    }
  });

  return null;
}
