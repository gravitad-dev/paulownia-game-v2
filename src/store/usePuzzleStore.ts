import { create } from "zustand";
import { PuzzlePiece } from "@/lib/game/puzzleGenerator";

interface PuzzleState {
  seed: number;
  pattern: PuzzlePiece[]; // Patrón original generado
  remainingPieces: PuzzlePiece[]; // Piezas puzzle que faltan por colocar
  placedPieces: PuzzlePiece[]; // Piezas correctamente colocadas
  pieceCounter: number; // Contador para alternar puzzle/normal (cada 2 piezas normales, 1 puzzle)
  currentPuzzlePiece: PuzzlePiece | null; // Pieza puzzle actual cayendo

  // Actions
  initialize: (seed: number, pattern: PuzzlePiece[]) => void;
  placePiece: (pieceId: string) => void;
  setCurrentPuzzlePiece: (piece: PuzzlePiece | null) => void;
  incrementPieceCounter: () => void;
  reset: () => void;
}

export const usePuzzleStore = create<PuzzleState>((set) => ({
  seed: 0,
  pattern: [],
  remainingPieces: [],
  placedPieces: [],
  pieceCounter: 0,
  currentPuzzlePiece: null,

  initialize: (seed, pattern) =>
    set({
      seed,
      pattern,
      remainingPieces: [...pattern],
      placedPieces: [],
      pieceCounter: 0,
      currentPuzzlePiece: null,
    }),

  placePiece: (pieceId) =>
    set((state) => {
      const piece = state.remainingPieces.find((p) => p.id === pieceId);
      if (!piece) return state;

      return {
        remainingPieces: state.remainingPieces.filter((p) => p.id !== pieceId),
        placedPieces: [...state.placedPieces, { ...piece, placed: true }],
        currentPuzzlePiece: null,
      };
    }),

  setCurrentPuzzlePiece: (piece) =>
    set({ currentPuzzlePiece: piece }),

  incrementPieceCounter: () =>
    set((state) => ({
      pieceCounter: state.pieceCounter + 1,
    })),

  reset: () =>
    set({
      seed: 0,
      pattern: [],
      remainingPieces: [],
      placedPieces: [],
      pieceCounter: 0,
      currentPuzzlePiece: null,
    }),
}));

