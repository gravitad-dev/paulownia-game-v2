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

  const handleStartGame = () => {
    if (!selectedDifficulty) return;

    const url = `/game/levels/${levelUuid}?difficulty=${selectedDifficulty}`;
    router.push(url);
    onOpenChange(false);
  };

  const handleDifficultySelect = (difficulty: LevelDifficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setSelectedDifficulty(null);
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

        <div className="grid grid-cols-2 gap-3 py-4">
          {DIFFICULTIES.map((difficulty) => (
            <Button
              key={difficulty.value}
              variant={
                selectedDifficulty === difficulty.value ? "default" : "outline"
              }
              onClick={() => handleDifficultySelect(difficulty.value)}
              className="h-auto py-4"
            >
              {difficulty.label}
            </Button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleStartGame}
            disabled={!selectedDifficulty}
          >
            Comenzar juego
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
