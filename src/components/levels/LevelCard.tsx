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
            className="bg-yellow-500/90 text-white border-yellow-400/50"
          >
            Bloqueado
          </Badge>
        );
      case "available":
        return (
          <Badge
            variant="secondary"
            className="bg-green-500/90 text-white border-green-400/50"
          >
            Disponible
          </Badge>
        );
      case "won":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-500/90 text-white border-blue-400/50"
          >
            Completado
          </Badge>
        );
      case "disabled":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-500/90 text-white border-gray-400/50"
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
        data-level-card
        className={cn(
          "flex flex-col overflow-hidden shadow-none hover:shadow-lg transition-shadow h-full min-h-[260px]",
          isDisabled && "opacity-60"
        )}
      >
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          {coverUrl ? (
            <>
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
              {/* Degradado oscuro sobre la imagen para mejorar legibilidad del badge */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-[#0B7431]/50 pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
          {/* Badge de estado en esquina superior izquierda */}
          {getStatusBadge() && (
            <div className="absolute top-2 left-2 z-10">{getStatusBadge()}</div>
          )}
          {isBlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <img
                src="/game/levels/cerradura.svg"
                alt="Bloqueado"
                width={70}
                height={85}
                className="drop-shadow-lg"
              />
            </div>
          )}
        </div>
        <CardContent className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">
              {level.name}
            </h3>
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
        coverImageUrl={level.cover?.url}
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
