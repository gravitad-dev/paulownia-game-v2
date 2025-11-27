import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { User } from "@/types/user";
import { useDailyRewardsStore } from "./useDailyRewardsStore";
import { useAchievementsStore } from "./useAchievementsStore";
import { usePlayerStatsStore } from "./usePlayerStatsStore";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        Cookies.set("auth_token", token, { expires: 7 }); // Expires in 7 days
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove("auth_token");
        // Reset stores to prevent data leaking between users
        useDailyRewardsStore.getState().reset();
        useAchievementsStore.getState().reset();
        usePlayerStatsStore.getState().reset();
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
    }),
    {
      name: "auth-storage",
    },
  ),
);
