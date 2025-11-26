"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Level } from "@/types/level";
import { getStrapiImageUrl } from "@/lib/image-utils";
import { DifficultySelectionModal } from "./DifficultySelectionModal";
import { Play } from "lucide-react";

interface LevelCardProps {
  level: Level;
}

export function LevelCard({ level }: LevelCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const coverUrl = getStrapiImageUrl(level.cover?.url);

  return (
    <>
      <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={level.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>
        <CardContent className="flex-1 p-4">
          <h3 className="font-semibold text-lg line-clamp-2">{level.name}</h3>
          {level.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {level.description}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={() => setIsModalOpen(true)}
          >
            <Play className="h-4 w-4 mr-2" />
            Comenzar juego
          </Button>
        </CardFooter>
      </Card>

      <DifficultySelectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        levelUuid={level.uuid}
        levelName={level.name}
      />
    </>
  );
}
