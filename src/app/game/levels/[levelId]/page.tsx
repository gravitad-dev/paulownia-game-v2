"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LevelService } from "@/services/level.service";
import { Level, LevelDifficulty } from "@/types/level";
import { getStrapiImageUrl } from "@/lib/image-utils";
import { ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const DIFFICULTY_LABELS: Record<LevelDifficulty, string> = {
  easy: "Fácil",
  easy2: "Fácil 2",
  medium: "Medio",
  medium2: "Medio 2",
  hard: "Difícil",
  hard2: "Difícil 2",
};

const DIFFICULTY_COLORS: Record<LevelDifficulty, string> = {
  easy: "bg-green-500/10 text-green-600 border-green-500/40",
  easy2: "bg-green-600/10 text-green-700 border-green-600/40",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/40",
  medium2: "bg-orange-500/10 text-orange-600 border-orange-500/40",
  hard: "bg-red-500/10 text-red-600 border-red-500/40",
  hard2: "bg-red-700/10 text-red-700 border-red-700/40",
};

export default function LevelDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const levelId = params.levelId as string;
  const difficultyParam = searchParams.get("difficulty");

  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCardExpanded, setIsCardExpanded] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      if (!levelId) {
        setError("ID de nivel no válido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const levelData = await LevelService.getByUuid(levelId);
        setLevel(levelData);
      } catch (err) {
        console.error("[LevelDetailPage] Error fetching level", err);
        setError("No se pudo cargar el nivel. Inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchLevel();
  }, [levelId]);

  const coverUrl = getStrapiImageUrl(level?.cover?.url);
  const difficulty = (difficultyParam as LevelDifficulty) || level?.difficulty;
  const puzzleImages = level?.puzzleImage || [];

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !level) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">
              {error || "Nivel no encontrado"}
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/game/levels")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a niveles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <Button
        variant="ghost"
        className=" bg-white/80 backdrop-blur-md border-border"
        onClick={() => router.push("/game/levels")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a niveles
      </Button>

      <div className="w-full h-full bg-white/80 backdrop-blur-md border-border my-8 p-4 flex items-center justify-center rounded-lg">
        <div
          id="game-container"
          className="w-[600px] h-[600px] bg-gray-700"
        ></div>
      </div>

      <Collapsible open={isCardExpanded} onOpenChange={setIsCardExpanded}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{level.name}</CardTitle>
                {difficulty && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border",
                      DIFFICULTY_COLORS[difficulty]
                    )}
                  >
                    {DIFFICULTY_LABELS[difficulty]}
                  </span>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isCardExpanded && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {coverUrl && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={coverUrl}
                    alt={level.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1200px"
                    priority
                  />
                </div>
              )}

              {level.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Descripción</h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {level.description}
                  </p>
                </div>
              )}

              {puzzleImages.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Imágenes del Puzzle
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {puzzleImages.map((image, index) => {
                      const imageUrl = getStrapiImageUrl(
                        typeof image === "object" &&
                          image !== null &&
                          "url" in image
                          ? image.url
                          : null
                      );
                      if (!imageUrl) return null;

                      return (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
                        >
                          <Image
                            src={imageUrl}
                            alt={`Puzzle ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {difficulty && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Dificultad seleccionada:{" "}
                    <span className="font-medium">
                      {DIFFICULTY_LABELS[difficulty]}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
