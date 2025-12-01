import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useConnectionStore } from "@/store/useConnectionStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Tipos de error personalizados para mejor manejo
export interface ApiError {
  message: string;
  code: "NETWORK_ERROR" | "SERVER_ERROR" | "AUTH_ERROR" | "UNKNOWN_ERROR";
  status?: number;
  originalError?: unknown;
}

// Helper para crear errores tipados
const createApiError = (
  message: string,
  code: ApiError["code"],
  status?: number,
  originalError?: unknown
): ApiError => ({
  message,
  code,
  status,
  originalError,
});

api.interceptors.response.use(
  (response) => {
    // Si recibimos respuesta exitosa, marcar como conectado
    const connectionStore = useConnectionStore.getState();
    if (!connectionStore.isConnected) {
      connectionStore.setConnected();
    }
    return response;
  },
  (error) => {
    const connectionStore = useConnectionStore.getState();

    // Error de red (servidor no disponible, sin conexión, etc.)
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      const message =
        "No se pudo conectar con el servidor. Por favor, verifica tu conexión o intenta más tarde.";
      connectionStore.setDisconnected(message);
      const apiError = createApiError(
        message,
        "NETWORK_ERROR",
        undefined,
        error
      );
      return Promise.reject(apiError);
    }

    // Error de conexión rechazada (backend no levantado)
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ERR_CONNECTION_REFUSED"
    ) {
      const message =
        "El servidor no está disponible en este momento. Por favor, intenta más tarde.";
      connectionStore.setDisconnected(message);
      const apiError = createApiError(
        message,
        "NETWORK_ERROR",
        undefined,
        error
      );
      return Promise.reject(apiError);
    }

    // Timeout
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      const message =
        "La solicitud tardó demasiado. Por favor, intenta nuevamente.";
      connectionStore.setDisconnected(message);
      const apiError = createApiError(
        message,
        "NETWORK_ERROR",
        undefined,
        error
      );
      return Promise.reject(apiError);
    }

    // Manejar error 401 (token expirado o inválido)
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState();

      // Solo mostrar modal si hay un usuario autenticado
      // (evita loops infinitos en la página de login)
      if (authStore.isAuthenticated) {
        // Mostrar modal de sesión expirada ANTES de logout
        // El logout se hará cuando el usuario haga clic en el botón del modal
        connectionStore.setSessionExpired();
      }

      const apiError = createApiError(
        "Tu sesión ha expirado",
        "AUTH_ERROR",
        401,
        error
      );
      return Promise.reject(apiError);
    }

    // Errores del servidor (5xx)
    if (error.response?.status >= 500) {
      const apiError = createApiError(
        "Ocurrió un error en el servidor. Por favor, intenta más tarde.",
        "SERVER_ERROR",
        error.response.status,
        error
      );
      return Promise.reject(apiError);
    }

    // Otros errores con respuesta (4xx excepto 401)
    if (error.response) {
      const message =
        error.response.data?.error?.message ||
        error.response.data?.message ||
        "Ocurrió un error inesperado";
      const apiError = createApiError(
        message,
        "UNKNOWN_ERROR",
        error.response.status,
        error
      );
      return Promise.reject(apiError);
    }

    // Error desconocido
    const apiError = createApiError(
      "Ocurrió un error inesperado. Por favor, intenta nuevamente.",
      "UNKNOWN_ERROR",
      undefined,
      error
    );
    return Promise.reject(apiError);
  }
);

// Helper para verificar si un error es de tipo ApiError
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
};

// Helper para obtener el mensaje de error de cualquier error
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocurrió un error inesperado";
};

// Helper para verificar si es un error de red
export const isNetworkError = (error: unknown): boolean => {
  return isApiError(error) && error.code === "NETWORK_ERROR";
};
