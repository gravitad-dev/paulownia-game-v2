import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CameraConfig {
  fov: number; // Campo de visión (50-120)
  zoom: number; // Zoom (1.0-10.0)
  heightMultiplier: number; // Multiplicador de altura (1.0-3.0)
  distanceMultiplier: number; // Multiplicador de distancia (0.3-2.0)
  offset: number; // Offset para vista frontal (0-10)
}

interface CameraConfigState {
  config: CameraConfig;
  updateConfig: (updates: Partial<CameraConfig>) => void;
  resetConfig: () => void;
}

// Valores por defecto (similar al original con más zoom)
const defaultConfig: CameraConfig = {
  fov: 120, // Igual al original
  zoom: 3.5, // Un poco más que el 3.0 del original
  heightMultiplier: 2.0, // Igual al original (size * 2)
  distanceMultiplier: 1.0, // Similar al original (~size)
  offset: 5, // Igual al original
};

export const useCameraConfigStore = create<CameraConfigState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      updateConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates },
        })),
      resetConfig: () =>
        set({
          config: defaultConfig,
        }),
    }),
    {
      name: "camera-config-storage",
    }
  )
);

