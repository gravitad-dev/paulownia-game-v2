import type { PlayerSessionType } from "@/types/player-stats";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

export interface SessionStatsPayload {
  gamesPlayed?: number;
  score?: number;
  coinsEarned?: number;
}

interface DeviceInfo {
  platform: string;
  browser: string;
  screenResolution: string;
}

export class PlayerSessionService {
  private baseUrl: string;

  constructor(private token: string) {
    this.baseUrl = `${API_URL}/api/player-dashboard`;
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
  }

  private static normalizeStats(
    stats?: SessionStatsPayload,
  ): Required<SessionStatsPayload> {
    return {
      gamesPlayed: stats?.gamesPlayed ?? 0,
      score: stats?.score ?? 0,
      coinsEarned: stats?.coinsEarned ?? 0,
    };
  }

  private getDefaultDeviceInfo(): DeviceInfo {
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    const screenWidth = typeof window !== "undefined" ? window.screen.width : 0;
    const screenHeight =
      typeof window !== "undefined" ? window.screen.height : 0;
    const isMobile = /Mobile|Android|iP(ad|hone)/i.test(userAgent);
    return {
      platform: isMobile ? "mobile" : "web",
      browser: userAgent,
      screenResolution: `${screenWidth}x${screenHeight}`,
    };
  }

  private async request<T = unknown>(
    path: string,
    options: RequestInit,
  ): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(
        `Player session request failed with status ${response.status}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async start(
    sessionType: PlayerSessionType = "idle",
    deviceInfo?: DeviceInfo,
  ) {
    const payload = {
      sessionType,
      deviceInfo: deviceInfo ?? this.getDefaultDeviceInfo(),
    };

    return this.request("/session/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async heartbeat(stats?: SessionStatsPayload) {
    const payload = PlayerSessionService.normalizeStats(stats);
    return this.request("/session/heartbeat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async end(stats?: SessionStatsPayload) {
    const payload = PlayerSessionService.normalizeStats(stats);
    return this.request("/session/end", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async endWithKeepAlive(stats?: SessionStatsPayload) {
    try {
      const payload = JSON.stringify(
        PlayerSessionService.normalizeStats(stats),
      );
      await fetch(this.buildUrl("/session/end"), {
        method: "POST",
        body: payload,
        headers: this.getHeaders(),
        keepalive: true,
      });
    } catch (error) {
      // Silenciar: el navegador puede cancelar la petición en onbeforeunload
      console.debug("No se pudo enviar end de sesión con keepalive", error);
    }
  }
}
