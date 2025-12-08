"use client";

import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LevelsGrid } from "@/components/levels/LevelsGrid";
import { LevelService } from "@/services/level.service";
import { UserLevelsResponse } from "@/types/user-level";
import { UserLevel } from "@/types/user-level";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { useAuthStore } from "@/store/useAuthStore";
import { Level } from "@/types/level";
import gsap from "gsap";

const PAGE_SIZE = 12;

// Tipo para la respuesta de la API que incluye los datos del Level con el campo status
interface MyLevelsApiItem extends Omit<Level, "id"> {
  id: number;
  status?: string;
  levelStatus?: string;
  lastPlayed?: string | null;
  wonDifficulties?: string[] | string | null;
}

/**
 * Parsea wonDifficulties que puede venir como string JSON, array, null o undefined
 */
function parseWonDifficulties(
  value: string[] | string | null | undefined
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
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
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const gsapCtxRef = useRef<gsap.Context | null>(null);
  const lastAnimationKeyRef = useRef<string | null>(null);
  const fetchKeyRef = useRef<string | null>(null);
  const devEffectGuardRef = useRef(false);

  useEffect(() => {
    const fetchUserLevels = async () => {
      if (!user) {
        setError("Debes iniciar sesión para ver los niveles");
        setLoading(false);
        return;
      }

      const fetchKey = `${user.documentId}-${pagination.page}-${pagination.pageSize}`;
      if (fetchKeyRef.current === fetchKey) return;
      fetchKeyRef.current = fetchKey;

      try {
        setLoading(true);
        setError(null);

        const res = await LevelService.getMyLevels({
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

        const mappedUserLevels: UserLevel[] = (
          (res.data || []) as MyLevelsApiItem[]
        ).map((item: MyLevelsApiItem) => {
          const levelStatus = item.status || item.levelStatus || "blocked";

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
            wonDifficulties: parseWonDifficulties(item.wonDifficulties),
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

  const animationKey = useMemo(() => {
    const uuids = userLevels.map((item) => item.uuid).join(",");
    return `${pagination.page}-${pagination.pageSize}-${uuids}`;
  }, [pagination.page, pagination.pageSize, userLevels]);

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
              wonDifficulties: parseWonDifficulties(item.wonDifficulties),
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

  // Animación fade-in/out del loading
  useEffect(() => {
    if (!loadingRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(loadingRef.current, { opacity: loading ? 1 : 0 });
      return;
    }

    if (loading) {
      gsap.fromTo(
        loadingRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          immediateRender: false,
        }
      );
    } else {
      gsap.to(loadingRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        immediateRender: false,
      });
    }
  }, [loading]);

  // Animaciones GSAP para el contenido: contenedor + cards individuales
  useLayoutEffect(() => {
    // En dev con StrictMode, el efecto se ejecuta dos veces.
    // Saltamos la primera ejecución fantasma para evitar animación doble.
    if (process.env.NODE_ENV !== "production" && !devEffectGuardRef.current) {
      devEffectGuardRef.current = true;
      return;
    }

    // Verificar si el usuario prefiere movimiento reducido
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Si está cargando, no animar
    if (loading) {
      // Limpiar animación anterior si existe
      if (gsapCtxRef.current) {
        gsapCtxRef.current.revert();
        gsapCtxRef.current = null;
      }
      lastAnimationKeyRef.current = null;
      return;
    }

    // Solo animar cuando hay datos y el contenedor está listo
    if (!containerRef.current || userLevels.length === 0) {
      return;
    }

    // Si ya se animó con esta key, asegurar estado final y salir
    if (lastAnimationKeyRef.current === animationKey) {
      gsap.set(containerRef.current, { opacity: 1, y: 0 });
      const cards = containerRef.current.querySelectorAll("[data-level-card]");
      gsap.set(cards, { opacity: 1, scale: 1, y: 0 });
      return;
    }

    // Limpiar animación anterior si existe
    if (gsapCtxRef.current) {
      gsapCtxRef.current.revert();
      gsapCtxRef.current = null;
    }

    // Si el usuario prefiere movimiento reducido, solo mostrar sin animación
    if (prefersReducedMotion) {
      gsap.set(containerRef.current, { opacity: 1, y: 0 });
      const cards = containerRef.current.querySelectorAll("[data-level-card]");
      gsap.set(cards, { opacity: 1, scale: 1, y: 0 });
      lastAnimationKeyRef.current = animationKey;
      return;
    }

    // Crear contexto GSAP para limpieza automática
    const ctx = gsap.context(() => {
      // Primera animación: contenedor principal
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          immediateRender: false,
          lazy: false,
          onComplete: () => {
            // Segunda animación: cards individuales con stagger
            const cards =
              containerRef.current?.querySelectorAll("[data-level-card]");
            if (cards && cards.length > 0) {
              gsap.fromTo(
                cards,
                {
                  opacity: 0,
                  scale: 0.8,
                  y: 30,
                },
                {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  duration: 0.4,
                  stagger: 0.05,
                  ease: "power2.out",
                  immediateRender: false,
                  lazy: false,
                }
              );
            }
          },
        }
      );

      // Guardar la key de animación actual
      lastAnimationKeyRef.current = animationKey;
    }, containerRef);

    gsapCtxRef.current = ctx;

    // Cleanup: revertir animaciones al desmontar o cambiar de datos
    return () => {
      if (gsapCtxRef.current) {
        gsapCtxRef.current.revert();
        gsapCtxRef.current = null;
      }
    };
  }, [loading, animationKey, userLevels.length]);

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Niveles" />

      <div className="flex-1 p-4 space-y-4">
        {/* Contenido principal */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : loading ? (
          <div
            ref={loadingRef}
            className="flex items-center justify-center min-h-[400px]"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full border-b-2 border-primary animate-spin" />
              <p className="text-muted-foreground">Cargando niveles...</p>
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="space-y-6 flex-1 min-h-[400px]">
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
