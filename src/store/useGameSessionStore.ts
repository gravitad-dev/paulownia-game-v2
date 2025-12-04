import { create } from "zustand";
import { GameSession } from "@/types/game-session";

/**
 * Estado de la sesión de juego
 */
type SessionStatus =
  | "idle" // Sin sesión activa
  | "starting" // Iniciando sesión con backend
  | "ready" // Sesión iniciada, listo para jugar
  | "playing" // Juego en curso
  | "ending" // Finalizando y enviando resultados
  | "completed" // Juego completado exitosamente
  | "error"; // Error en la sesión

interface GameSessionState {
  /** Estado actual de la sesión */
  status: SessionStatus;
  /** Datos de la sesión activa */
  session: GameSession | null;
  /** Mensaje de error si hay alguno */
  error: string | null;
  /** Resultados del juego después de finalizar */
  results: {
    status: "won" | "lost" | "abandoned";
    score: number;
    duration: number;
    completedAt: string;
    levelStatus: "won" | "available";
    alreadyCompleted?: boolean;
  } | null;

  // Actions
  /** Inicia una nueva sesión (llamar antes de startGame del servicio) */
  setStarting: () => void;
  /** Guarda la sesión iniciada exitosamente */
  setSession: (session: GameSession) => void;
  /** Marca que el juego está en curso */
  setPlaying: () => void;
  /** Marca que se está finalizando el juego */
  setEnding: () => void;
  /** Guarda los resultados del juego */
  setResults: (results: GameSessionState["results"]) => void;
  /** Establece un error */
  setError: (error: string) => void;
  /** Limpia el error */
  clearError: () => void;
  /** Reinicia toda la sesión */
  reset: () => void;
}

const initialState = {
  status: "idle" as SessionStatus,
  session: null,
  error: null,
  results: null,
};

export const useGameSessionStore = create<GameSessionState>((set) => ({
  ...initialState,

  setStarting: () =>
    set({
      status: "starting",
      error: null,
      results: null,
    }),

  setSession: (session: GameSession) =>
    set({
      status: "ready",
      session,
      error: null,
    }),

  setPlaying: () =>
    set((state) => ({
      status: state.session ? "playing" : "idle",
    })),

  setEnding: () =>
    set((state) => ({
      status: state.session ? "ending" : "idle",
    })),

  setResults: (results) =>
    set({
      status: "completed",
      results,
    }),

  setError: (error: string) =>
    set({
      status: "error",
      error,
    }),

  clearError: () =>
    set({
      error: null,
      status: "idle",
    }),

  reset: () => set(initialState),
}));

/**
 * Selectores para optimizar re-renders
 */
export const gameSessionSelectors = {
  /** Obtiene solo el estado de la sesión */
  status: (state: GameSessionState) => state.status,
  /** Obtiene la sesión actual */
  session: (state: GameSessionState) => state.session,
  /** Obtiene el hash de la sesión (necesario para end) */
  hash: (state: GameSessionState) => state.session?.hash ?? null,
  /** Obtiene la seed de la sesión */
  seed: (state: GameSessionState) => state.session?.seed ?? null,
  /** Obtiene el gridSize */
  gridSize: (state: GameSessionState) => state.session?.gridSize ?? null,
  /** Obtiene el error actual */
  error: (state: GameSessionState) => state.error,
  /** Obtiene los resultados */
  results: (state: GameSessionState) => state.results,
  /** Verifica si hay una sesión activa */
  hasActiveSession: (state: GameSessionState) =>
    state.session !== null && ["ready", "playing"].includes(state.status),
  /** Verifica si está cargando */
  isLoading: (state: GameSessionState) =>
    ["starting", "ending"].includes(state.status),
};
