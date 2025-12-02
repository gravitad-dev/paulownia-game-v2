import { create } from "zustand";

interface SessionAggregate {
  gamesPlayed: number;
  score: number;
  coinsEarned: number;
}

interface PlayerSessionState {
  stats: SessionAggregate;
  setStats: (partial: Partial<SessionAggregate>) => void;
  recordGame: (session: Partial<SessionAggregate>) => void;
  reset: () => void;
  getStats: () => SessionAggregate;
}

const initialStats: SessionAggregate = {
  gamesPlayed: 0,
  score: 0,
  coinsEarned: 0,
};

export const usePlayerSessionStore = create<PlayerSessionState>()(
  (set, get) => ({
    stats: initialStats,
    setStats: (partial) =>
      set((state) => ({
        stats: {
          ...state.stats,
          ...partial,
        },
      })),
    recordGame: ({ gamesPlayed = 0, score = 0, coinsEarned = 0 }) =>
      set((state) => ({
        stats: {
          gamesPlayed: state.stats.gamesPlayed + gamesPlayed,
          score: state.stats.score + score,
          coinsEarned: state.stats.coinsEarned + coinsEarned,
        },
      })),
    reset: () => set({ stats: { ...initialStats } }),
    getStats: () => get().stats,
  }),
);
