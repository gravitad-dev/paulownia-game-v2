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
import { Button } from "@/components/ui/button";
import { LevelDifficulty } from "@/types/level";
import { DIFFICULTY_CONFIGS } from "@/lib/game/difficultyConfig";
import { GameService } from "@/services/game.service";
import { useGameSessionStore } from "@/store/useGameSessionStore";
import { isValidSeed } from "@/types/game-session";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DifficultySelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelUuid: string;
  levelName: string;
}

// Generar lista de dificultades desde la configuración centralizada
const DIFFICULTIES: { value: LevelDifficulty; label: string }[] = (
  Object.entries(DIFFICULTY_CONFIGS) as [LevelDifficulty, typeof DIFFICULTY_CONFIGS[LevelDifficulty]][]
).map(([value, config]) => ({
  value,
  label: config.label,
}));

export function DifficultySelectionModal({
  open,
  onOpenChange,
  levelUuid,
  levelName,
}: DifficultySelectionModalProps) {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<LevelDifficulty | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store de sesión de juego
  const { setStarting, setSession, setError: setStoreError, reset } =
    useGameSessionStore();

  const handleStartGame = async () => {
    if (!selectedDifficulty) return;

    setIsLoading(true);
    setError(null);
    setStarting();

    try {
      // 1. Llamar al backend para iniciar la sesión
      const response = await GameService.startGame(levelUuid, selectedDifficulty);

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecciona la dificultad</DialogTitle>
          <DialogDescription>
            Elige el nivel de dificultad para jugar {levelName}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 py-4">
          {DIFFICULTIES.map((difficulty) => (
            <Button
              key={difficulty.value}
              variant={
                selectedDifficulty === difficulty.value ? "default" : "outline"
              }
              onClick={() => handleDifficultySelect(difficulty.value)}
              className="h-auto py-4"
              disabled={isLoading}
            >
              {difficulty.label}
            </Button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleStartGame}
            disabled={!selectedDifficulty || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando...
              </>
            ) : (
              "Comenzar juego"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
