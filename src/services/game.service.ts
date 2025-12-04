import { withBasePath } from "./base.service";
import {
  StartGameRequest,
  StartGameResponse,
  EndGameRequest,
  EndGameResponse,
  BackendDifficulty,
  DIFFICULTY_MAP,
  generateGameSeed,
} from "@/types/game-session";
import { LevelDifficulty } from "@/types/level";
import { useAuthStore } from "@/store/useAuthStore";

const gameApi = withBasePath("/api/game");

/**
 * Servicio para manejar sesiones de juego (inicio y fin de partida)
 */
export const GameService = {
  /**
   * Inicia una nueva partida
   * POST /api/game/start
   *
   * @param levelUuid - UUID del nivel a jugar
   * @param difficulty - Dificultad seleccionada (frontend)
   * @returns Promise con hash, gridSize, startedAt, gameHistoryId
   * @throws Error con mensaje descriptivo si falla
   */
  async startGame(
    levelUuid: string,
    difficulty: LevelDifficulty
  ): Promise<StartGameResponse["data"] & { seed: string }> {
    // Generar seed para el tablero
    const seed = generateGameSeed();
    const startAt = new Date().toISOString();
    const backendDifficulty: BackendDifficulty = DIFFICULTY_MAP[difficulty];

    const payload: StartGameRequest = {
      levelUuid,
      difficulty: backendDifficulty,
      startAt,
      seed,
    };

    // Debug: Verificar token y payload
    const token = useAuthStore.getState().token;
    console.log("[GameService] startGame - Token disponible:", token ? "Sí" : "No");
    console.log("[GameService] startGame - Token (primeros 20 chars):", token?.substring(0, 20) || "N/A");
    console.log("[GameService] startGame - Payload:", JSON.stringify(payload, null, 2));
    console.log("[GameService] startGame - URL completa: POST /api/game/start");

    try {
      const response = await gameApi.post<StartGameResponse>("/start", payload);
      console.log("[GameService] startGame - Respuesta exitosa:", response.data);
      return {
        ...response.data.data,
        seed, // Incluir la seed usada para generar el tablero
      };
    } catch (error: unknown) {
      // Debug: Log completo del error
      console.error("[GameService] startGame - Error completo:", error);
      const err = error as {
        response?: { 
          status?: number;
          statusText?: string;
          data?: { reason?: string; required?: string[]; error?: unknown };
          headers?: Record<string, string>;
        };
        message?: string;
        config?: {
          url?: string;
          method?: string;
          headers?: Record<string, string>;
          data?: unknown;
        };
      };
      
      console.error("[GameService] startGame - Status:", err.response?.status);
      console.error("[GameService] startGame - Status Text:", err.response?.statusText);
      console.error("[GameService] startGame - Response Data:", err.response?.data);
      console.error("[GameService] startGame - Request Config:", {
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers,
        data: err.config?.data,
      });

      const reason = err.response?.data?.reason;

      switch (reason) {
        case "unauthorized":
          throw new Error("Debes iniciar sesión para jugar");
        case "missing_required_fields":
          throw new Error("Faltan campos requeridos para iniciar el juego");
        case "level_not_found":
          throw new Error("El nivel no existe");
        case "level_not_unlocked":
          throw new Error("El nivel no está desbloqueado. Ingresa la contraseña primero.");
        case "level_locked":
          throw new Error("El nivel está bloqueado o deshabilitado");
        default:
          throw new Error(
            err.message || "Error al iniciar el juego. Inténtalo de nuevo."
          );
      }
    }
  },

  /**
   * Finaliza una partida y envía los resultados
   * POST /api/game/end
   *
   * @param params - Parámetros de finalización
   * @returns Promise con score, duration, completedAt, levelStatus
   * @throws Error con mensaje descriptivo si falla
   */
  async endGame(params: {
    levelUuid: string;
    difficulty: LevelDifficulty;
    hash: string;
    status: "won" | "lost" | "abandoned";
    bonusPoints?: number;
  }): Promise<EndGameResponse["data"]> {
    const endAt = new Date().toISOString();
    const backendDifficulty: BackendDifficulty = DIFFICULTY_MAP[params.difficulty];

    const payload: EndGameRequest = {
      levelUuid: params.levelUuid,
      difficulty: backendDifficulty,
      endAt,
      hash: params.hash,
      status: params.status,
      bonusPoints: params.bonusPoints,
    };

    // Debug: Verificar token y payload
    const token = useAuthStore.getState().token;
    console.log("[GameService] endGame - Token disponible:", token ? "Sí" : "No");
    console.log("[GameService] endGame - Payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await gameApi.post<EndGameResponse>("/end", payload);
      console.log("[GameService] endGame - Respuesta exitosa:", response.data);
      return response.data.data;
    } catch (error: unknown) {
      // Debug: Log completo del error
      console.error("[GameService] endGame - Error completo:", error);
      const err = error as {
        response?: { 
          status?: number;
          statusText?: string;
          data?: { reason?: string; error?: unknown };
        };
        message?: string;
      };
      
      console.error("[GameService] endGame - Status:", err.response?.status);
      console.error("[GameService] endGame - Response Data:", err.response?.data);

      const reason = err.response?.data?.reason;

      switch (reason) {
        case "unauthorized":
          throw new Error("Debes iniciar sesión para guardar tu progreso");
        case "missing_required_fields":
          throw new Error("Faltan campos requeridos para finalizar el juego");
        case "level_not_found":
          throw new Error("El nivel no existe");
        case "history_not_found":
          throw new Error("No se encontró la sesión de juego. Es posible que haya expirado.");
        default:
          throw new Error(
            err.message || "Error al guardar los resultados. Inténtalo de nuevo."
          );
      }
    }
  },
};

