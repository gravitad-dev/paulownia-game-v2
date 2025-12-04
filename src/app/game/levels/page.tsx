"use client";

import { useEffect, useState } from "react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LevelsGrid } from "@/components/levels/LevelsGrid";
import { LevelService } from "@/services/level.service";
import { UserLevelsResponse } from "@/types/user-level";
import { UserLevel } from "@/types/user-level";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { useAuthStore } from "@/store/useAuthStore";
import { Level } from "@/types/level";

const PAGE_SIZE = 12;

// Tipo para la respuesta de la API que incluye los datos del Level con el campo status
interface MyLevelsApiItem extends Omit<Level, "id"> {
  id: number;
  status?: string;
  levelStatus?: string;
  lastPlayed?: string | null;
}

export default function LevelsPage() {
  const { user } = useAuthStore();
  const [userLevels, setUserLevels] = useState<UserLevel[]>([]);
  const [pagination, setPagination] = useState<
    UserLevelsResponse["meta"]["pagination"]
  >({
    page: 1,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserLevels = async () => {
      if (!user) {
        setError("Debes iniciar sesión para ver los niveles");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener UserLevels del usuario usando el endpoint custom
        const res = await LevelService.getMyLevels({
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

        // La API devuelve los datos del Level directamente con un campo "status" que es el levelStatus
        // Necesitamos mapear la respuesta al formato UserLevel esperado
        // Type assertion: la API devuelve MyLevelsApiItem[] aunque el tipo diga UserLevel[]
        const mappedUserLevels: UserLevel[] = (
          (res.data || []) as MyLevelsApiItem[]
        ).map((item: MyLevelsApiItem) => {
          // Extraer levelStatus del campo "status"
          const levelStatus = item.status || item.levelStatus || "blocked";

          // El objeto completo es el Level, así que creamos un UserLevel con el level incluido
          const userLevel: UserLevel = {
            id: item.id || 0,
            documentId: item.documentId,
            uuid: item.uuid,
            levelStatus: levelStatus.trim() as UserLevel["levelStatus"],
            level: {
              id: item.id,
              documentId: item.documentId,
              uuid: item.uuid,
              name: item.name,
              description: item.description,
              cover: item.cover,
              puzzleImage: item.puzzleImage,
              difficulty: item.difficulty,
              password: item.password,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            },
            lastPlayed: item.lastPlayed,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };

          return userLevel;
        });

        setUserLevels(mappedUserLevels);
        setPagination(res.meta.pagination);
      } catch (err) {
        console.error("[LevelsPage] Error fetching user levels", err);
        setError(
          "No se pudieron cargar los niveles. Inténtalo de nuevo más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserLevels();
  }, [pagination.page, pagination.pageSize, user]);

  const handleUnlockSuccess = () => {
    // Recargar los niveles después de desbloquear
    if (user) {
      LevelService.getMyLevels({
        page: pagination.page,
        pageSize: pagination.pageSize,
      })
        .then((res) => {
          // Mapear la respuesta al formato UserLevel
          // Type assertion: la API devuelve MyLevelsApiItem[] aunque el tipo diga UserLevel[]
          const mappedUserLevels: UserLevel[] = (
            (res.data || []) as MyLevelsApiItem[]
          ).map((item: MyLevelsApiItem) => {
            const levelStatus = item.status || item.levelStatus || "blocked";
            return {
              id: item.id || 0,
              documentId: item.documentId,
              uuid: item.uuid,
              levelStatus: levelStatus.trim() as UserLevel["levelStatus"],
              level: {
                id: item.id,
                documentId: item.documentId,
                uuid: item.uuid,
                name: item.name,
                description: item.description,
                cover: item.cover,
                puzzleImage: item.puzzleImage,
                difficulty: item.difficulty,
                password: item.password,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              },
              lastPlayed: item.lastPlayed,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
          });
          setUserLevels(mappedUserLevels);
          setPagination(res.meta.pagination);
        })
        .catch((err) => {
          console.error("[LevelsPage] Error refreshing levels", err);
        });
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Niveles" />

      <div className="flex-1 p-4 space-y-4">
        {/* Subtítulo descriptivo */}
        <div>
          <p className="text-sm text-muted-foreground">
            Selecciona un nivel para comenzar a jugar
          </p>
        </div>

        {/* Contenido principal */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 flex-1">
            <LevelsGrid
              userLevels={userLevels}
              isLoading={loading}
              onUnlockSuccess={handleUnlockSuccess}
            />
            <TablePagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={handlePageChange}
              label="niveles"
            />
          </div>
        )}
      </div>
    </div>
  );
}
