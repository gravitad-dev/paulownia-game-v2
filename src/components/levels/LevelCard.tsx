"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserLevel, LevelStatus } from "@/types/user-level";
import { Level } from "@/types/level";
import { getStrapiImageUrl } from "@/lib/image-utils";
import { DifficultySelectionModal } from "./DifficultySelectionModal";
import { LevelUnlockModal } from "./LevelUnlockModal";
import { UnlockResultModal } from "./UnlockResultModal";
import { LevelService } from "@/services/level.service";
import { Play, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface LevelCardProps {
  userLevel: UserLevel;
  onUnlockSuccess?: () => void;
}

export function LevelCard({ userLevel, onUnlockSuccess }: LevelCardProps) {
  const [isDifficultyModalOpen, setIsDifficultyModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultSuccess, setResultSuccess] = useState(false);

  // Extraer el nivel de la relación
  const level =
    typeof userLevel.level === "object" && userLevel.level !== null
      ? (userLevel.level as Level)
      : null;

  // Si el nivel no está populado, mostrar un mensaje o retornar null
  if (!level) {
    console.warn(
      "[LevelCard] Level not populated for UserLevel:",
      userLevel.uuid
    );
    return (
      <Card className="flex flex-col overflow-hidden opacity-60">
        <CardContent className="flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            Cargando información del nivel...
          </p>
        </CardContent>
      </Card>
    );
  }

  const coverUrl = getStrapiImageUrl(level.cover?.url);

  // Normalizar levelStatus (trim para eliminar espacios en blanco)
  const normalizedStatus = (userLevel.levelStatus || "").trim() as LevelStatus;

  const isBlocked = normalizedStatus === "blocked";
  const isWon = normalizedStatus === "won";
  const isDisabled = normalizedStatus === "disabled";

  const handleUnlock = async (password: string) => {
    try {
      const response = await LevelService.unlock(level.uuid, password);
      setResultMessage(response.message);
      setResultSuccess(true);
      setIsUnlockModalOpen(false);
      setIsResultModalOpen(true);
      onUnlockSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Contraseña incorrecta";
      setResultMessage(errorMessage);
      setResultSuccess(false);
      setIsUnlockModalOpen(false);
      setIsResultModalOpen(true);
    }
  };

  const getStatusBadge = () => {
    switch (normalizedStatus) {
      case "blocked":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
          >
            Bloqueado
          </Badge>
        );
      case "available":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
          >
            Disponible
          </Badge>
        );
      case "won":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
          >
            Completado
          </Badge>
        );
      case "disabled":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
          >
            Deshabilitado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card
        className={cn(
          "flex flex-col overflow-hidden hover:shadow-lg transition-shadow",
          isDisabled && "opacity-60"
        )}
      >
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={level.name}
              fill
              className={cn(
                "object-cover",
                isBlocked && "grayscale opacity-75"
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
          {isBlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Lock className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
        <CardContent className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">
              {level.name}
            </h3>
            {getStatusBadge()}
          </div>
          {level.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {level.description}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          {isBlocked ? (
            <Button
              className="w-full"
              onClick={() => setIsUnlockModalOpen(true)}
              variant="outline"
            >
              <Lock className="h-4 w-4 mr-2" />
              Desbloquear
            </Button>
          ) : isDisabled ? (
            <Button className="w-full" disabled>
              Nivel Deshabilitado
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => setIsDifficultyModalOpen(true)}
            >
              <Play className="h-4 w-4 mr-2" />
              {isWon ? "Jugar de nuevo" : "Comenzar juego"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <DifficultySelectionModal
        open={isDifficultyModalOpen}
        onOpenChange={setIsDifficultyModalOpen}
        levelUuid={level.uuid}
        levelName={level.name}
      />

      <LevelUnlockModal
        open={isUnlockModalOpen}
        onOpenChange={setIsUnlockModalOpen}
        levelName={level.name}
        onUnlock={handleUnlock}
      />

      <UnlockResultModal
        open={isResultModalOpen}
        onOpenChange={setIsResultModalOpen}
        success={resultSuccess}
        message={resultMessage}
      />
    </>
  );
}
