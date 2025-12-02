import { create } from "zustand";
import { PuzzlePiece, PuzzleGenerationResult } from "@/lib/game/puzzleGenerator";
import { Tile } from "@/lib/game/puzzleTile";

interface PuzzleState {
  /** Seed usada para generar el patrón */
  seed: number;
  /** Grid de tiles (imagen cortada) */
  tileGrid: Tile[][];
  /** Patrón original de piezas generado */
  pattern: PuzzlePiece[];
  /** Piezas puzzle que faltan por colocar */
  remainingPieces: PuzzlePiece[];
  /** Piezas correctamente colocadas y bloqueadas */
  placedPieces: PuzzlePiece[];
  /** Contador para alternar puzzle/normal (cada 3 piezas, 1 puzzle) */
  pieceCounter: number;
  /** Pieza puzzle actualmente cayendo */
  currentPuzzlePiece: PuzzlePiece | null;
  /** Indica si el puzzle está completo (todas las piezas colocadas) */
  isComplete: boolean;
  /** Modo test: true = solo piezas puzzle, false = mezcla con normales */
  testMode: boolean;

  // Actions
  /** Inicializa el puzzle con una seed y el resultado de generación */
  initializeFromResult: (seed: number, result: PuzzleGenerationResult) => void;
  /** @deprecated Usar initializeFromResult. Inicializa solo con pattern */
  initialize: (seed: number, pattern: PuzzlePiece[]) => void;
  /** Marca una pieza como colocada correctamente */
  placePiece: (pieceId: string) => void;
  /** Descarta una pieza puzzle que fue mal colocada (la quita de remainingPieces sin añadirla a placedPieces) */
  discardPiece: (pieceId: string) => void;
  /** Establece la pieza puzzle actual que está cayendo */
  setCurrentPuzzlePiece: (piece: PuzzlePiece | null) => void;
  /** Incrementa el contador de piezas */
  incrementPieceCounter: () => void;
  /** Reinicia el estado del puzzle */
  reset: () => void;
  /** Obtiene un tile por sus coordenadas de juego */
  getTileAt: (x: number, z: number) => Tile | undefined;
  /** Activa/desactiva modo test (solo piezas puzzle) */
  setTestMode: (enabled: boolean) => void;
}

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  seed: 0,
  tileGrid: [],
  pattern: [],
  remainingPieces: [],
  placedPieces: [],
  pieceCounter: 0,
  currentPuzzlePiece: null,
  isComplete: false,
  testMode: true, // Por defecto en modo test (solo piezas puzzle)

  initializeFromResult: (seed, result) =>
    set({
      seed,
      tileGrid: result.tileGrid,
      pattern: result.pieces,
      remainingPieces: [...result.pieces],
      placedPieces: [],
      pieceCounter: 0,
      currentPuzzlePiece: null,
      isComplete: false,
    }),

  // Mantener compatibilidad con código existente
  initialize: (seed, pattern) =>
    set({
      seed,
      tileGrid: [], // No hay tileGrid en la versión legacy
      pattern,
      remainingPieces: [...pattern],
      placedPieces: [],
      pieceCounter: 0,
      currentPuzzlePiece: null,
      isComplete: false,
    }),

  placePiece: (pieceId) =>
    set((state) => {
      const piece = state.remainingPieces.find((p) => p.id === pieceId);
      if (!piece) return state;

      const newRemainingPieces = state.remainingPieces.filter(
        (p) => p.id !== pieceId
      );
      const newPlacedPieces = [...state.placedPieces, { ...piece, placed: true }];
      const isComplete = newRemainingPieces.length === 0;

      return {
        remainingPieces: newRemainingPieces,
        placedPieces: newPlacedPieces,
        currentPuzzlePiece: null,
        isComplete,
      };
    }),

  discardPiece: (pieceId) =>
    set((state) => ({
      remainingPieces: state.remainingPieces.filter((p) => p.id !== pieceId),
      currentPuzzlePiece: null,
    })),

  setCurrentPuzzlePiece: (piece) => set({ currentPuzzlePiece: piece }),

  incrementPieceCounter: () =>
    set((state) => ({
      pieceCounter: state.pieceCounter + 1,
    })),

  reset: () =>
    set((state) => ({
      seed: 0,
      tileGrid: [],
      pattern: [],
      remainingPieces: [],
      placedPieces: [],
      pieceCounter: 0,
      currentPuzzlePiece: null,
      isComplete: false,
      testMode: state.testMode, // Mantener el modo actual
    })),

  getTileAt: (x: number, z: number) => {
    const { tileGrid } = get();
    // x = column, z = row
    if (z < 0 || z >= tileGrid.length) return undefined;
    if (x < 0 || x >= tileGrid[z].length) return undefined;
    return tileGrid[z][x];
  },

  setTestMode: (enabled: boolean) => set({ testMode: enabled }),
}));
