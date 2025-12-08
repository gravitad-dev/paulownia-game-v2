"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlayerStatsService } from "@/services/player-stats.service";
import { UserService } from "@/services/user.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { PlayerStatsSummary } from "@/types/player-stats";
import { ContentLoading } from "@/components/ui/ContentLoading";
import {
  Calendar,
  CheckCircle,
  Coins,
  Crown,
  LucideIcon,
  Star,
  Swords,
  Ticket,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

// Componente para barra de progreso con etiqueta
function ProgressSection({
  label,
  current,
  total,
  percentage,
  icon: Icon,
  iconColor = "text-primary",
}: {
  label: string;
  current: number;
  total: number;
  percentage: number;
  icon: LucideIcon;
  iconColor?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {current} / {total}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">
        {percentage.toFixed(0)}% completado
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [stats, setStats] = useState<PlayerStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user data first
        const userData = await UserService.getMe();
        updateUser(userData);

        // Then fetch stats (passing user's createdAt for memberSince fallback)
        try {
          const statsData = await PlayerStatsService.getSummary(
            userData.createdAt
          );
          setStats(statsData);
        } catch (statsErr) {
          console.error("Error fetching stats:", statsErr);
          setError("No se pudieron cargar las estadísticas de juego");
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Error al cargar el perfil");

        // Try to at least get user data
        if (user?.id) {
          try {
            const userDataById = await UserService.getById(user.id);
            updateUser(userDataById);
          } catch (innerError) {
            console.error("Error fetching user data by ID:", innerError);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avatarUrl = user?.avatar?.url
    ? user.avatar.url.startsWith("http")
      ? user.avatar.url
      : `${API_URL}${user.avatar.url}`
    : null;

  const initials = user?.username
    ? user.username
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {isLoading ? (
        <ContentLoading message="Cargando perfil..." />
      ) : (
        <>
          {/* Header del perfil */}
          <Card className="overflow-hidden">
            <div className="relative h-24 sm:h-32">
              <style
                dangerouslySetInnerHTML={{
                  __html: `
              @keyframes bannerTwinkle {
                0%, 100% { opacity: 0.25; }
                50% { opacity: 0.55; }
              }
            `,
                }}
              />
              <div className="absolute inset-0 bg-linear-to-br from-[#0a1028] via-[#111b3a] to-[#030617]" />
              <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_10%_20%,rgba(124,58,237,0.18)_0%,transparent_60%),radial-gradient(80%_60%_at_85%_40%,rgba(34,197,94,0.12)_0%,transparent_55%)]" />
              <div className="absolute inset-0">
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    top: "18%",
                    left: "12%",
                    width: "3px",
                    height: "3px",
                    animation: "bannerTwinkle 5s infinite ease-in-out",
                    opacity: 0.6,
                  }}
                />
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    top: "36%",
                    left: "28%",
                    width: "2px",
                    height: "2px",
                    animation: "bannerTwinkle 4.5s infinite ease-in-out",
                    opacity: 0.5,
                  }}
                />
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    top: "22%",
                    left: "72%",
                    width: "3px",
                    height: "3px",
                    animation: "bannerTwinkle 5.5s infinite ease-in-out",
                    opacity: 0.55,
                  }}
                />
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    top: "58%",
                    left: "65%",
                    width: "2px",
                    height: "2px",
                    animation: "bannerTwinkle 4.2s infinite ease-in-out",
                    opacity: 0.5,
                  }}
                />
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    top: "54%",
                    left: "18%",
                    width: "2px",
                    height: "2px",
                    animation: "bannerTwinkle 4.8s infinite ease-in-out",
                    opacity: 0.45,
                  }}
                />
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    top: "42%",
                    left: "88%",
                    width: "3px",
                    height: "3px",
                    animation: "bannerTwinkle 6s infinite ease-in-out",
                    opacity: 0.6,
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-linear-to-r from-background/60 via-background/30 to-transparent" />
            </div>
            <CardContent className="relative px-6 pb-6">
              {/* Avatar */}
              <div className="absolute -top-12 sm:-top-16 left-6">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={user?.username || "Avatar"}
                    width={128}
                    height={128}
                    className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-muted border-4 border-background shadow-lg text-2xl sm:text-3xl font-bold text-muted-foreground">
                    {initials}
                  </div>
                )}
              </div>

              {/* Info del usuario */}
              <div className="pt-14 sm:pt-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      {user?.username || "Usuario"}
                    </h1>
                    {user?.isPremium && (
                      <div className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-amber-600 text-sm font-semibold">
                        <Star className="h-4 w-4 text-amber-500" />
                        Premium
                      </div>
                    )}
                  </div>
                  {user?.name && user?.lastname && (
                    <p className="text-muted-foreground">
                      {user.name} {user.lastname}
                    </p>
                  )}
                  {stats?.meta.memberSince && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Miembro desde {formatDate(stats.meta.memberSince)}
                    </p>
                  )}
                </div>

                {/* Ranking badge */}
                {stats?.ranking && stats.ranking.totalPlayers > 0 && (
                  <div className="flex items-center gap-3 sm:gap-4 bg-linear-to-br from-amber-500/15 via-yellow-500/10 to-orange-500/15 rounded-xl px-4 sm:px-5 py-3 sm:py-4 border border-amber-500/25">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                        <span className="text-xl sm:text-2xl font-black text-white leading-none ml-1">
                          {stats.ranking.globalRank}°
                        </span>
                      </div>
                      {stats.ranking.globalRank <= 1 && (
                        <Crown className="absolute -top-1.5 -right-0.5 sm:-top-2 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 text-amber-600 drop-shadow-md" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-600 font-semibold">
                        Ranking Global
                      </p>
                      <p className="text-base sm:text-lg font-bold truncate">
                        de {stats.ranking.totalPlayers} jugadores
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="py-4 text-center text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          {stats && (
            <div className="space-y-4 sm:space-y-6 px-1 sm:px-2">
              {/* Estadísticas principales - Grid de 4 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Monedas */}
                <Card className="bg-linear-to-br from-amber-500/10 to-transparent border-amber-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-amber-500/20">
                        <Coins className="h-6 w-6 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monedas</p>
                        <p className="text-2xl font-bold">
                          {stats.basicStats.coins.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tickets */}
                <Card className="bg-linear-to-br from-purple-500/10 to-transparent border-purple-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-purple-500/20">
                        <Ticket className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tickets</p>
                        <p className="text-2xl font-bold">
                          {stats.basicStats.tickets.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-orange-500/10 to-transparent border-orange-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-orange-500/20">
                        <Swords className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Victorias</p>
                        <p className="text-2xl font-bold">
                          {stats.gameStats.gamesWon.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* XP */}
                <Card className="bg-linear-to-br from-blue-500/10 to-transparent border-blue-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-blue-500/20">
                        <Zap className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Experiencia</p>
                        <p className="text-2xl font-bold">
                          {stats.gameStats.xp.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progreso - Niveles y Logros */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {/* Nivel actual */}
                <Card className="bg-linear-to-br from-blue-500/5 to-transparent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">
                      Nivel Actual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats.levels.currentLevel !== null && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold">
                            Nivel {stats.levels.currentLevel}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {stats.levels.levelsCompleted} de{" "}
                            {stats.levels.totalLevels} completados
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            XP actual
                          </p>
                          <p className="font-medium">
                            {stats.gameStats.xp.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                    )}
                    {stats.levels.currentLevel === null && (
                      <div className="text-center py-2">
                        <p className="text-muted-foreground">
                          Aún no has comenzado a jugar
                        </p>
                      </div>
                    )}
                    <ProgressSection
                      label="Progreso"
                      current={stats.levels.levelsCompleted}
                      total={stats.levels.totalLevels}
                      percentage={stats.levels.progress}
                      icon={CheckCircle}
                      iconColor="text-blue-500"
                    />
                  </CardContent>
                </Card>

                {/* Logros */}
                <Card className="bg-linear-to-br from-amber-500/5 to-transparent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Logros</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl sm:text-2xl font-bold">
                          {stats.achievements.achievementsUnlocked}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          desbloqueados
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Total
                        </p>
                        <p className="font-medium">
                          {stats.achievements.totalAchievements}
                        </p>
                      </div>
                    </div>
                    <ProgressSection
                      label="Progreso"
                      current={stats.achievements.achievementsUnlocked}
                      total={stats.achievements.totalAchievements}
                      percentage={stats.achievements.progress}
                      icon={Star}
                      iconColor="text-amber-500"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
