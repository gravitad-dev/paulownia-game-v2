import { create } from "zustand";

// Tipos de sonido disponibles
type SoundType = "move" | "lineClear" | "wallHit" | "pieceLock" | "victory" | "gameOver";

// Contexto de audio global (singleton)
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  // Reanudar si está suspendido (requisito de navegadores modernos)
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
};

// Generadores de sonido sintético usando Web Audio API
const soundGenerators: Record<SoundType, (volume: number) => void> = {
  // Movimiento: tono suave y corto tipo "whoosh"
  move: (volume: number) => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      400,
      ctx.currentTime + 0.05
    );

    gainNode.gain.setValueAtTime(0.08 * volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  },

  // Destrucción de línea: "pop" satisfactorio
  lineClear: (volume: number) => {
    const ctx = getAudioContext();

    // Tono principal
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(600, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain1.gain.setValueAtTime(0.15 * volume, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Armónico
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1200, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.08 * volume, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.1);
  },

  // Colisión con muro: "thud" seco
  wallHit: (volume: number) => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      50,
      ctx.currentTime + 0.08
    );

    gainNode.gain.setValueAtTime(0.12 * volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  },

  // Pieza colocada correctamente: "click" satisfactorio
  pieceLock: (volume: number) => {
    const ctx = getAudioContext();

    // Click principal
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.05);
    gain1.gain.setValueAtTime(0.2 * volume, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.12);

    // Segundo tono armonioso (quinta)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.1 * volume, ctx.currentTime + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.15);
  },

  // Victoria: fanfarria ascendente de 3 tonos
  victory: (volume: number) => {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (acorde mayor)
    const noteDelay = 0.12;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * noteDelay);

      const startTime = ctx.currentTime + i * noteDelay;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25 * volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });

    // Acorde final sostenido
    setTimeout(() => {
      const finalNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      finalNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.15 * volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      });
    }, 360);
  },

  // Game Over: tono descendente dramático
  gameOver: (volume: number) => {
    const ctx = getAudioContext();
    const notes = [392, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4 (descendente menor)
    const noteDelay = 0.2;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * noteDelay);

      const startTime = ctx.currentTime + i * noteDelay;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12 * volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });

    // Tono grave final
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3

      gain.gain.setValueAtTime(0.2 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    }, 800);
  },
};

interface AudioState {
  // Estado
  isMuted: boolean;
  globalVolume: number;
  isInitialized: boolean;

  // Acciones
  initialize: () => void;
  toggleMute: () => void;
  setGlobalVolume: (volume: number) => void;
  playMove: () => void;
  playLineClear: () => void;
  playWallHit: () => void;
  playPieceLock: () => void;
  playVictory: () => void;
  playGameOver: () => void;
}

// Función para reproducir un sonido
const playSound = (
  type: SoundType,
  isMuted: boolean,
  globalVolume: number
): void => {
  if (isMuted || typeof window === "undefined") return;

  try {
    soundGenerators[type](globalVolume);
  } catch (error) {
    console.warn(`[Audio] Error al reproducir sonido ${type}:`, error);
  }
};

export const useAudioStore = create<AudioState>((set, get) => ({
  isMuted: false,
  globalVolume: 1.0,
  isInitialized: false,

  initialize: () => {
    if (get().isInitialized) return;

    // Inicializar contexto de audio (requiere interacción del usuario en algunos navegadores)
    if (typeof window !== "undefined") {
      try {
        getAudioContext();
      } catch (error) {
        console.warn("[Audio] No se pudo inicializar AudioContext:", error);
      }
    }

    set({ isInitialized: true });
  },

  toggleMute: () => {
    const newMuted = !get().isMuted;
    set({ isMuted: newMuted });
  },

  setGlobalVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ globalVolume: clampedVolume });
  },

  playMove: () => {
    const { isMuted, globalVolume } = get();
    playSound("move", isMuted, globalVolume);
  },

  playLineClear: () => {
    const { isMuted, globalVolume } = get();
    playSound("lineClear", isMuted, globalVolume);
  },

  playWallHit: () => {
    const { isMuted, globalVolume } = get();
    playSound("wallHit", isMuted, globalVolume);
  },

  playPieceLock: () => {
    const { isMuted, globalVolume } = get();
    playSound("pieceLock", isMuted, globalVolume);
  },

  playVictory: () => {
    const { isMuted, globalVolume } = get();
    playSound("victory", isMuted, globalVolume);
  },

  playGameOver: () => {
    const { isMuted, globalVolume } = get();
    playSound("gameOver", isMuted, globalVolume);
  },
}));

// Exportar acciones directas para uso fuera de componentes React
export const audioActions = {
  playMove: () => useAudioStore.getState().playMove(),
  playLineClear: () => useAudioStore.getState().playLineClear(),
  playWallHit: () => useAudioStore.getState().playWallHit(),
  playPieceLock: () => useAudioStore.getState().playPieceLock(),
  playVictory: () => useAudioStore.getState().playVictory(),
  playGameOver: () => useAudioStore.getState().playGameOver(),
};
