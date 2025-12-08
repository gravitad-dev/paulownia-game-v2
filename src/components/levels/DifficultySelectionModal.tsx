"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button3D } from "@/components/ui/Button3D";
import { Card, CardContent } from "@/components/ui/card";
import { LevelDifficulty } from "@/types/level";
import { DIFFICULTY_CONFIGS, formatTime } from "@/lib/game/difficultyConfig";
import { GameService } from "@/services/game.service";
import { useGameSessionStore } from "@/store/useGameSessionStore";
import { isValidSeed } from "@/types/game-session";
import { Loader2, AlertCircle } from "lucide-react";
import { FiClock, FiStar } from "react-icons/fi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getStrapiImageUrl } from "@/lib/image-utils";

interface DifficultySelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelUuid: string;
  levelName: string;
  coverImageUrl?: string | null;
}

// Función para obtener iconos de chile picante según la dificultad
const getPepperIcons = (difficulty: LevelDifficulty): string => {
  const pepper = "🌶️";
  switch (difficulty) {
    case "easy":
    case "easy2":
      return pepper;
    case "medium":
    case "medium2":
      return `${pepper}${pepper}`;
    case "hard":
      return `${pepper}${pepper}${pepper}`;
    case "hard2":
      return `${pepper}${pepper}${pepper}${pepper}`;
    default:
      return pepper;
  }
};

// Función para extraer solo las clases de border de badgeColor
const getBorderClasses = (badgeColor: string): string => {
  const classes = badgeColor.split(" ");
  // Filtrar solo las clases de border, excluyendo bg-* y text-*
  return classes.filter((cls) => cls.startsWith("border-")).join(" ");
};

// Función para extraer solo las clases de text de badgeColor
const getTextClasses = (badgeColor: string): string => {
  const classes = badgeColor.split(" ");
  // Filtrar solo las clases de text, excluyendo bg-* y border-*
  return classes.filter((cls) => cls.startsWith("text-")).join(" ");
};

// Generar lista de dificultades desde la configuración centralizada
const DIFFICULTIES: Array<{
  value: LevelDifficulty;
  label: string;
  timeLimitSeconds: number;
  baseScore: number;
  borderClasses: string;
  textClasses: string;
}> = (
  Object.entries(DIFFICULTY_CONFIGS) as [
    LevelDifficulty,
    (typeof DIFFICULTY_CONFIGS)[LevelDifficulty]
  ][]
).map(([value, config]) => ({
  value,
  label: config.label,
  timeLimitSeconds: config.timeLimitSeconds,
  baseScore: config.baseScore,
  borderClasses: getBorderClasses(config.badgeColor),
  textClasses: getTextClasses(config.badgeColor),
}));

export function DifficultySelectionModal({
  open,
  onOpenChange,
  levelUuid,
  levelName,
  coverImageUrl,
}: DifficultySelectionModalProps) {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<LevelDifficulty | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store de sesión de juego
  const {
    setStarting,
    setSession,
    setError: setStoreError,
    reset,
  } = useGameSessionStore();

  const handleStartGame = async () => {
    if (!selectedDifficulty) return;

    setIsLoading(true);
    setError(null);
    setStarting();

    try {
      // 1. Llamar al backend para iniciar la sesión
      const response = await GameService.startGame(
        levelUuid,
        selectedDifficulty
      );

      // 2. Validar que la seed sea apta para generar el tablero
      if (!isValidSeed(response.seed)) {
        throw new Error("La seed recibida no es válida para generar el nivel");
      }

      // 3. Guardar la sesión en el store
      setSession({
        levelUuid,
        difficulty: selectedDifficulty,
        hash: response.hash,
        seed: response.seed,
        gridSize: response.gridSize,
        startedAt: response.startedAt,
        gameHistoryId: response.gameHistoryId,
      });

      // 4. Navegar a la página del juego con los parámetros
      const url = `/game/levels/${levelUuid}?difficulty=${selectedDifficulty}`;
      router.push(url);
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error de conexión. Por favor, inténtalo de nuevo.";
      setError(errorMessage);
      setStoreError(errorMessage);
      reset(); // Limpiar sesión si hay error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDifficultySelect = (difficulty: LevelDifficulty) => {
    setSelectedDifficulty(difficulty);
    setError(null); // Limpiar error al seleccionar dificultad
  };

  const handleClose = (open: boolean) => {
    if (isLoading) return; // No cerrar mientras carga
    onOpenChange(open);
    if (!open) {
      setSelectedDifficulty(null);
      setError(null);
    }
  };

  const coverUrl = coverImageUrl ? getStrapiImageUrl(coverImageUrl) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 [&>button]:z-[100] [&>button]:bg-background/80 [&>button]:backdrop-blur-sm [&>button]:rounded-full [&>button]:p-1">
        {/* Banner con cover image */}
        {coverUrl && (
          <div className="relative w-full h-32 sm:h-40 overflow-hidden rounded-t-lg z-0">
            <Image
              src={coverUrl}
              alt={levelName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 500px "
            />
            {/* Gradiente oscuro para legibilidad (mismo que en la card) */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-[#0B7431]/60 pointer-events-none z-0" />
            {/* Texto sobre la imagen */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 pointer-events-none">
              <DialogHeader>
                <DialogTitle className="text-white text-center text-xl sm:text-2xl font-bold drop-shadow-lg">
                  Selecciona la dificultad
                </DialogTitle>
                <DialogDescription className="text-white/90 text-center text-sm sm:text-base mt-2 drop-shadow-md">
                  Elige el nivel de dificultad para jugar {levelName}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        )}

        <div className="p-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-1.5 py-2">
            {DIFFICULTIES.map((difficulty) => {
              const isSelected = selectedDifficulty === difficulty.value;
              return (
                <Card
                  key={difficulty.value}
                  onClick={() =>
                    !isLoading && handleDifficultySelect(difficulty.value)
                  }
                  className={cn(
                    "cursor-pointer shadow-none transition-all duration-200 relative bg-white border-2",
                    "border-gray-300",
                    isSelected && difficulty.borderClasses,
                    difficulty.textClasses,
                    isSelected
                      ? "shadow-lg opacity-100"
                      : "opacity-90 hover:opacity-100",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Image
                        src="/game/levels/star.svg"
                        alt="Seleccionado"
                        width={20}
                        height={20}
                        className="drop-shadow-lg"
                      />
                    </div>
                  )}
                  <CardContent className="p-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <h3 className="font-semibold text-sm">
                        {difficulty.label}
                      </h3>
                      <span className="text-sm">
                        {getPepperIcons(difficulty.value)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <FiClock className="h-3 w-3" />
                        <span className="text-muted-foreground">
                          {formatTime(difficulty.timeLimitSeconds)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <FiStar className="h-3 w-3" />
                        <span className="text-muted-foreground">
                          {difficulty.baseScore.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button3D
              onClick={handleStartGame}
              disabled={!selectedDifficulty || isLoading}
              variant="green"
              className="w-[50%] h-[40px] mb-2  mt-5 flex items-center justify-center text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Iniciar"
              )}
            </Button3D>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
