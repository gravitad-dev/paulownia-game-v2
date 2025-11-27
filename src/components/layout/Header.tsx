"use client";

import { NotificationIndicator } from "@/components/notifications/NotificationIndicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CoinsBadge } from "@/components/ui/CoinsBadge";
import { TicketsBadge } from "@/components/ui/TicketsBadge";
import { cn } from "@/lib/utils";
import { UserService } from "@/services/user.service";
import { useAchievementsStore } from "@/store/useAchievementsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useDailyRewardsStore } from "@/store/useDailyRewardsStore";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";
import gsap from "gsap";
import {
  Bell,
  Calendar,
  ChevronDown,
  Gift,
  Home,
  Layers,
  LogOut,
  Settings,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

const navigation = [
  { name: "Inicio", href: "/game", icon: Home },
  { name: "Niveles", href: "/game/levels", icon: Layers },
  { name: "Premios", href: "/game/rewards", icon: Gift },
  { name: "Logros", href: "/game/achievements", icon: Trophy },
  { name: "Eventos", href: "/game/events", icon: Calendar },
];

export function Header() {
  const { user, logout, updateUser } = useAuthStore();
  const canClaimDailyReward = useDailyRewardsStore((state) => state.canClaim);
  const playerStats = usePlayerStatsStore((state) => state.stats);
  const availableAchievements = useAchievementsStore(
    (state) => state.availableCount,
  );
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const dropdownItemsRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  // Cargar datos del usuario automáticamente al montar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const userData = await UserService.getMe();
        updateUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (user?.id) {
          try {
            const userDataById = await UserService.getById(user.id);
            updateUser(userDataById);
          } catch (innerError) {
            console.error("Error fetching user data by ID:", innerError);
          }
        }
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animación de hover en items del menú
  useEffect(() => {
    navItemsRef.current.forEach((item) => {
      if (!item) return;

      const handleMouseEnter = () => {
        gsap.to(item, {
          scale: 1.05,
          duration: 0.2,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(item, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out",
        });
      };

      item.addEventListener("mouseenter", handleMouseEnter);
      item.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        item.removeEventListener("mouseenter", handleMouseEnter);
        item.removeEventListener("mouseleave", handleMouseLeave);
      };
    });
  }, []);

  // Animación stagger de items del dropdown
  useEffect(() => {
    if (isDropdownOpen && dropdownItemsRef.current) {
      const items = dropdownItemsRef.current.querySelectorAll(
        "[data-dropdown-item]",
      );
      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: -10,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          stagger: 0.05,
          ease: "power2.out",
        },
      );
    }
  }, [isDropdownOpen]);

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

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1200px] px-4">
      <div className="bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Columna 1: Logo / Brand */}
        <Link
          href="/game"
          className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center">
            <Image
              src="/brand/Logo.png"
              alt="Paulownia Logo"
              width={32}
              height={32}
              className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
              priority
            />
          </div>
          <span className="font-bold text-base sm:text-lg hidden sm:block text-foreground">
            Paulownia
          </span>
        </Link>

        {/* Columna 2: Navigation Menu */}
        <nav className="flex items-center gap-1 flex-1 justify-center">
          {navigation.map((item, index) => {
            const isActive =
              item.href === "/game"
                ? pathname === "/game"
                : pathname.startsWith(item.href);
            const showBadge =
              (item.href === "/game/events" && canClaimDailyReward) ||
              (item.href === "/game/achievements" && availableAchievements > 0);
            return (
              <Link
                key={item.name}
                href={item.href}
                ref={(el) => {
                  navItemsRef.current[index] = el;
                }}
                className={cn(
                  "relative flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">{item.name}</span>

                {showBadge && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Columna 3: Stats, Notifications & User Avatar con Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border shrink-0">
          {/* Stats badges - Solo visible en desktop */}
          {user && playerStats && (
            <div className="hidden md:flex items-center gap-2">
              <CoinsBadge
                amount={playerStats.coins}
                size="sm"
                variant="outline"
              />
              <TicketsBadge
                amount={playerStats.tickets}
                size="sm"
                variant="outline"
              />
            </div>
          )}

          {user && <NotificationIndicator />}

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 sm:gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-1 transition-all">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-background overflow-hidden">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={user?.username || "Avatar"}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  ) : user?.username ? (
                    initials
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56"
              ref={dropdownItemsRef}
            >
              {/* Header con nombre y stats en móvil */}
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {user?.username || "Usuario"}
                </span>
                {/* Stats badges - Solo visible en móvil dentro del dropdown */}
                {playerStats && (
                  <div className="flex items-center gap-1.5 md:hidden">
                    <CoinsBadge
                      amount={playerStats.coins}
                      size="sm"
                      variant="default"
                    />
                    <TicketsBadge
                      amount={playerStats.tickets}
                      size="sm"
                      variant="default"
                    />
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                data-dropdown-item
                onClick={() => router.push("/game/profile")}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                data-dropdown-item
                onClick={() => router.push("/game/notifications")}
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>Notificaciones</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                data-dropdown-item
                onClick={() => router.push("/game/profile/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                data-dropdown-item
                variant="destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
