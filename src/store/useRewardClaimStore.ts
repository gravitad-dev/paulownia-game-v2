import { create } from "zustand";
import type { RewardClaim, Guardian } from "@/types/reward-claim";

interface RewardClaimState {
  // Estado
  currentClaim: RewardClaim | null;
  userGuardians: Guardian[];
  isLoading: boolean;
  error: string | null;

  // Acciones
  setCurrentClaim: (claim: RewardClaim | null) => void;
  setUserGuardians: (guardians: Guardian[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentClaim: null,
  userGuardians: [],
  isLoading: false,
  error: null,
};

export const useRewardClaimStore = create<RewardClaimState>((set) => ({
  ...initialState,

  setCurrentClaim: (claim) => set({ currentClaim: claim }),
  setUserGuardians: (guardians) => set({ userGuardians: guardians }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
