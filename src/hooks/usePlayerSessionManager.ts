import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { PlayerSessionService } from "@/services/player-session.service";
import type { PlayerSessionType } from "@/types/player-stats";
import { usePlayerSessionStore } from "@/store/usePlayerSessionStore";

const HEARTBEAT_INTERVAL_MS = 30_000;

export const usePlayerSessionManager = (
  enabled: boolean,
  sessionType: PlayerSessionType = "idle",
) => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !token) {
      return;
    }

    const sessionService = new PlayerSessionService(token);
    let heartbeatId: number | null = null;
    let sessionActive = false;

    const stopHeartbeat = () => {
      if (heartbeatId !== null) {
        clearInterval(heartbeatId);
        heartbeatId = null;
      }
    };

    const sendHeartbeat = async () => {
      const stats = usePlayerSessionStore.getState().getStats();
      try {
        await sessionService.heartbeat(stats);
      } catch (error) {
        console.error(
          "Error enviando heartbeat de la sesión del jugador",
          error,
        );
      }
    };

    const startHeartbeat = () => {
      if (heartbeatId !== null) return;
      heartbeatId = window.setInterval(() => {
        void sendHeartbeat();
      }, HEARTBEAT_INTERVAL_MS);
    };

    const endSession = async (useKeepAlive = false) => {
      if (!sessionActive) return;
      const stats = usePlayerSessionStore.getState().getStats();
      try {
        if (useKeepAlive) {
          await sessionService.endWithKeepAlive(stats);
        } else {
          await sessionService.end(stats);
        }
      } catch (error) {
        console.error("Error al finalizar la sesión del jugador", error);
      } finally {
        sessionActive = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopHeartbeat();
        void sendHeartbeat();
      } else if (sessionActive) {
        startHeartbeat();
      }
    };

    const handleBeforeUnload = () => {
      void endSession(true);
    };

    const startSession = async () => {
      try {
        usePlayerSessionStore.getState().reset();
        await sessionService.start(sessionType);
        sessionActive = true;
        startHeartbeat();
      } catch (error) {
        console.error("No se pudo iniciar la sesión del jugador", error);
      }
    };

    void startSession();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopHeartbeat();
      void endSession();
    };
  }, [enabled, isAuthenticated, sessionType, token]);
};
