import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { User } from "@/types/user";
import { useDailyRewardsStore } from "./useDailyRewardsStore";
import { useAchievementsStore } from "./useAchievementsStore";
import { usePlayerStatsStore } from "./usePlayerStatsStore";
import { useNotificationStore } from "./useNotificationStore";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, remember?: boolean) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// Helper function to check if authenticated
const checkIsAuthenticated = (
  token: string | null,
  user: User | null,
): boolean => {
  if (!token || !user) return false;
  // Also check cookie to ensure sync
  const cookieToken = Cookies.get("auth_token");
  return !!cookieToken;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token, remember) => {
        const cookieOptions: Cookies.CookieAttributes = {
          sameSite: "Lax",
          secure: window.location.protocol === "https:",
        };
        
        // Si remember es true, la cookie dura 30 días.
        // Si es false, no seteamos expires, convirtiéndola en "Session Cookie" (se borra al cerrar navegador).
        // Si es undefined (por defecto), mantenemos el comportamiento de sesión (false).
        if (remember) {
          cookieOptions.expires = 30; 
        }

        Cookies.set("auth_token", token, cookieOptions);
        set({
          user,
          token,
          isAuthenticated: checkIsAuthenticated(token, user),
        });
      },
      logout: () => {
        Cookies.remove("auth_token", { sameSite: "Lax" });
        // Reset stores to prevent data leaking between users
        useDailyRewardsStore.getState().reset();
        useAchievementsStore.getState().reset();
        usePlayerStatsStore.getState().reset();
        useNotificationStore.getState().reset();
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updatedUser) =>
        set((state) => {
          const updatedUserData = state.user
            ? { ...state.user, ...updatedUser }
            : null;
          return {
            user: updatedUserData,
            isAuthenticated: checkIsAuthenticated(state.token, updatedUserData),
          };
        }),
    }),
    {
      name: "auth-storage",
      // Rehydrate and check authentication on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          const isAuth = checkIsAuthenticated(state.token, state.user);
          state.isAuthenticated = isAuth;
          if (!isAuth) {
            state.user = null;
            state.token = null;
          }
        }
      },
    },
  ),
);
