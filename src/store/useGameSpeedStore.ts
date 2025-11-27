import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GameSpeedState {
  cycleTime: number; // Tiempo de ciclo en ms (100-1000)
  setCycleTime: (value: number) => void;
  resetCycleTime: () => void;
}

const DEFAULT_CYCLE_TIME = 350;

export const useGameSpeedStore = create<GameSpeedState>()(
  persist(
    (set) => ({
      cycleTime: DEFAULT_CYCLE_TIME,
      setCycleTime: (value) =>
        set({
          cycleTime: Math.max(100, Math.min(1000, value)), // Clamp entre 100 y 1000
        }),
      resetCycleTime: () =>
        set({
          cycleTime: DEFAULT_CYCLE_TIME,
        }),
    }),
    {
      name: "game-speed-storage",
    }
  )
);

