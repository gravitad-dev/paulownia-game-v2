import { create } from "zustand";

interface ConnectionState {
  isConnected: boolean;
  isChecking: boolean;
  lastError: string | null;
  retryCount: number;
  sessionExpired: boolean;

  // Actions
  setDisconnected: (errorMessage: string) => void;
  setConnected: () => void;
  setChecking: (checking: boolean) => void;
  incrementRetry: () => void;
  setSessionExpired: () => void;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isConnected: true,
  isChecking: false,
  lastError: null,
  retryCount: 0,
  sessionExpired: false,

  setDisconnected: (errorMessage: string) =>
    set({
      isConnected: false,
      lastError: errorMessage,
      isChecking: false,
    }),

  setConnected: () =>
    set({
      isConnected: true,
      lastError: null,
      isChecking: false,
      retryCount: 0,
    }),

  setChecking: (checking: boolean) =>
    set({
      isChecking: checking,
    }),

  incrementRetry: () =>
    set((state) => ({
      retryCount: state.retryCount + 1,
    })),

  setSessionExpired: () =>
    set({
      sessionExpired: true,
    }),

  reset: () =>
    set({
      isConnected: true,
      isChecking: false,
      lastError: null,
      retryCount: 0,
      sessionExpired: false,
    }),
}));
