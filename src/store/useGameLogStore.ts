import { create } from "zustand";

export interface GameLogEntry {
  timestamp: number;
  type:
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

interface GameLogState {
  logs: GameLogEntry[];
  enabled: boolean;
  addLog: (entry: Omit<GameLogEntry, "timestamp">) => void;
  clearLogs: () => void;
  setEnabled: (enabled: boolean) => void;
  exportLogs: () => string;
}

export const useGameLogStore = create<GameLogState>((set, get) => ({
  logs: [],
  enabled: true, // Habilitado por defecto para depuración

  addLog: (entry) => {
    if (!get().enabled) return;

    const logEntry: GameLogEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    // También mostrar en consola con formato claro
    const timeStr = new Date(logEntry.timestamp).toLocaleTimeString();
    const prefix = `[GAME ${timeStr}]`;

    switch (entry.type) {
      case "spawn":
        console.log(
          `${prefix} 🎮 SPAWN: ${entry.pieceType} (${entry.pieceId})`,
          `| Pos: (${entry.position?.x}, ${entry.position?.y}, ${entry.position?.z})`,
          `| Rot: ${entry.rotation}`,
          `| PatternRot: ${entry.patternRotation}`,
          `| Remaining: ${entry.remainingPieces}/${entry.totalPieces}`
        );
        break;
      case "rotate":
        console.log(
          `${prefix} 🔄 ROTATE: ${entry.pieceId}`,
          `| NewRot: ${entry.rotation}`,
          `| PatternRot: ${entry.patternRotation}`,
          `| CorrectOrientation: ${entry.isCorrectOrientation ? "✅" : "❌"}`
        );
        break;
      case "place_success":
        console.log(
          `${prefix} ✅ PLACE SUCCESS: ${entry.pieceId}`,
          `| Pos: (${entry.position?.x}, ${entry.position?.y}, ${entry.position?.z})`,
          `| Placed: ${entry.placedPieces}/${entry.totalPieces}`
        );
        break;
      case "place_fail":
        console.log(
          `${prefix} ❌ PLACE FAIL: ${entry.pieceId}`,
          `| Pos: (${entry.position?.x}, ${entry.position?.y}, ${entry.position?.z})`,
          `| Rot: ${entry.rotation}`,
          `| PatternRot: ${entry.patternRotation}`,
          `| Reason: ${entry.failReason}`,
          `| Details: ${entry.details}`
        );
        break;
      case "discard":
        console.log(
          `${prefix} 🔁 DISCARD (requeue): ${entry.pieceId}`,
          `| Remaining after: ${entry.remainingPieces}`
        );
        break;
      case "victory":
        console.log(
          `${prefix} 🏆 VICTORY!`,
          `| Placed: ${entry.placedPieces}/${entry.totalPieces}`
        );
        break;
      case "gameover":
        console.log(`${prefix} 💀 GAME OVER`, `| Reason: ${entry.details}`);
        break;
      case "line_clear":
        console.log(`${prefix} 💥 LINE CLEAR`, `| ${entry.details}`);
        break;
      default:
        console.log(`${prefix} 📝 ${entry.type}:`, entry);
    }

    set((state) => ({
      logs: [...state.logs, logEntry],
    }));
  },

  clearLogs: () => set({ logs: [] }),

  setEnabled: (enabled) => set({ enabled }),

  exportLogs: () => {
    const { logs } = get();
    return JSON.stringify(logs, null, 2);
  },
}));

