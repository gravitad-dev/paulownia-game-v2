import { create } from "zustand";

export interface GameLogEntry {
  timestamp: number;
  type:
    | "game_start"
    | "spawn"
    | "move"
    | "rotate"
    | "place_success"
    | "place_fail"
    | "discard"
    | "victory"
    | "gameover"
    | "line_clear";
  pieceId?: string;
  pieceType?: string;
  position?: { x: number; y: number; z: number };
  rotation?: number;
  patternRotation?: number;
  isCorrectOrientation?: boolean;
  remainingPieces?: number;
  placedPieces?: number;
  totalPieces?: number;
  failReason?: string;
  details?: string;
}

export interface ErrorLogEntry {
  timestamp: number;
  message: string;
  error?: string;
  context?: string;
}

interface GameLogState {
  logs: GameLogEntry[];
  errors: ErrorLogEntry[];
  enabled: boolean;
  addLog: (entry: Omit<GameLogEntry, "timestamp">) => void;
  addError: (message: string, error?: unknown, context?: string) => void;
  clearLogs: () => void;
  clearAll: () => void;
  setEnabled: (enabled: boolean) => void;
  exportLogs: () => string;
  printGameSummary: () => void;
}

export const useGameLogStore = create<GameLogState>((set, get) => ({
  logs: [],
  errors: [],
  enabled: true, // Habilitado por defecto para depuración

  addLog: (entry) => {
    if (!get().enabled) return;

    const logEntry: GameLogEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    // Almacenar silenciosamente sin imprimir a consola
    set((state) => ({
      logs: [...state.logs, logEntry],
    }));
  },

  addError: (message, error, context) => {
    const errorEntry: ErrorLogEntry = {
      timestamp: Date.now(),
      message,
      error: error instanceof Error ? error.message : error !== undefined ? String(error) : undefined,
      context,
    };

    set((state) => ({
      errors: [...state.errors, errorEntry],
    }));
  },

  clearLogs: () => set({ logs: [] }),

  clearAll: () => set({ logs: [], errors: [] }),

  setEnabled: (enabled) => set({ enabled }),

  exportLogs: () => {
    const { logs } = get();
    return JSON.stringify(logs, null, 2);
  },

  printGameSummary: () => {
    // Variables deshabilitadas temporalmente para debugging futuro
    // const { logs, errors } = get();

    // Buscar log de inicio (deshabilitado, pero latente para debugging)
    // const gameStartLog = logs.find((log) => log.type === "game_start");
    // if (gameStartLog) {
    //   const timeStr = new Date(gameStartLog.timestamp).toLocaleTimeString();
    //   console.log(`[GAME ${timeStr}] 🎮 INICIO DE JUEGO`, gameStartLog.details || "");
    // }

    // Buscar log de finalización (deshabilitado, pero latente para debugging)
    // const finalLog = logs.find(
    //   (log) => log.type === "victory" || log.type === "gameover"
    // );
    // if (finalLog) {
    //   const timeStr = new Date(finalLog.timestamp).toLocaleTimeString();
    //   if (finalLog.type === "victory") {
    //     console.log(
    //       `[GAME ${timeStr}] 🏆 VICTORIA!`,
    //       `| Piezas colocadas: ${finalLog.placedPieces}/${finalLog.totalPieces}`
    //     );
    //   } else {
    //     console.log(
    //       `[GAME ${timeStr}] 💀 GAME OVER`,
    //       `| Razón: ${finalLog.details || "Desconocida"}`
    //     );
    //   }
    // }

    // Mostrar historial completo (deshabilitado, pero latente para debugging)
    // console.log("=== HISTORIAL COMPLETO DEL JUEGO ===");
    // console.log(JSON.stringify(logs, null, 2));

    // Mostrar errores si los hay (deshabilitado, pero latente para debugging)
    // if (errors.length > 0) {
    //   console.log("=== ERRORES CAPTURADOS ===");
    //   console.log(JSON.stringify(errors, null, 2));
    // }
  },
}));

