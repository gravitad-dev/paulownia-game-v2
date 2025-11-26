"use client";

import { Fragment, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  LuAward,
  LuBell,
  LuMedal,
  LuRefreshCw,
  LuSettings,
  LuTarget,
  LuUser,
} from "react-icons/lu";
import { IconType } from "react-icons";
import gsap from "gsap";

type ProfileTabGroup = "public" | "settings";

interface ProfileTab {
  value: string;
  label: string;
  href: string;
  icon: IconType;
  group: ProfileTabGroup;
  disabled?: boolean;
}

const profileTabs: ProfileTab[] = [
  {
    value: "profile",
    label: "Perfil",
    href: "/game/profile",
    icon: LuUser,
    group: "public",
  },
  {
    value: "scores",
    label: "Puntajes",
    href: "/game/profile/scores",
    icon: LuTarget,
    group: "public",
  },
  {
    value: "awards",
    label: "Premios",
    href: "/game/profile/awards",
    icon: LuAward,
    group: "public",
  },
  {
    value: "achievements",
    label: "Logros",
    href: "/game/profile/achievements",
    icon: LuMedal,
    group: "public",
  },
  {
    value: "changes",
    label: "Cambios",
    href: "/game/profile/changes",
    icon: LuRefreshCw,
    group: "public",
  },
  {
    value: "notifications",
    label: "Notificaciones",
    href: "/game/profile/notifications",
    icon: LuBell,
    group: "settings",
  },
  {
    value: "settings",
    label: "Configuración",
    href: "/game/profile/settings",
    icon: LuSettings,
    group: "settings",
  },
];

const getCurrentTab = (pathname: string): string => {
  // Ordenar tabs por longitud de href descendente para que las rutas más específicas se evalúen primero
  const sortedTabs = [...profileTabs].sort(
    (a, b) => b.href.length - a.href.length
  );
  const match = sortedTabs.find(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  );
  return match ? match.value : "profile";
};

export function ProfileTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const previousTabRef = useRef<string | null>(null);

  const currentTab = getCurrentTab(pathname);

  useEffect(() => {
    // Animar la tab activa cuando cambia
    if (activeTabRef.current && previousTabRef.current !== currentTab) {
      gsap.fromTo(
        activeTabRef.current,
        {
          scale: 0.95,
        },
        {
          scale: 1,
          duration: 0.2,
          ease: "back.out(1.2)",
        }
      );
      previousTabRef.current = currentTab;
    }
  }, [currentTab]);

  const handleChange = (value: string) => {
    const tab = profileTabs.find((tab) => tab.value === value);
    if (tab && !tab.disabled) {
      router.push(tab.href);
    }
  };

  return (
    <div className="relative z-10 w-full">
      <Tabs
        value={currentTab}
        onValueChange={handleChange}
        className={cn("w-full", className)}
      >
        <TabsList className="relative flex w-full flex-nowrap justify-start gap-0 overflow-x-auto overflow-y-hidden rounded-none border-0 bg-transparent px-2 py-0 scrollbar-hide sm:gap-2 sm:px-2">
          {profileTabs.map((tab, index) => {
            const previousGroup = profileTabs[index - 1]?.group;
            const showSeparator = previousGroup && previousGroup !== tab.group;

            return (
              <Fragment key={tab.value}>
                {showSeparator && (
                  <span className="mx-0.5 hidden h-6 w-px bg-border/60 sm:mx-1 sm:block" />
                )}
                <TabsTrigger
                  ref={tab.value === currentTab ? activeTabRef : null}
                  value={tab.value}
                  disabled={tab.disabled}
                  aria-label={tab.label}
                  className={cn(
                    "flex items-center justify-center rounded-t-lg rounded-b-none border-x-0 border-t border-b-0 border-border/60 bg-muted/70 transition-all first:border-l last:border-r first:rounded-tl-lg last:rounded-tr-lg",
                    // Mobile/Tablet (< md): Tab inactiva 40x40px (cubo), activa 80x40px
                    "flex-initial w-10 h-10 px-1 py-1",
                    "data-[state=active]:w-20 data-[state=active]:h-10 data-[state=active]:px-2 data-[state=active]:py-2",
                    // Desktop (>= md): Todas las tabs 80x40px con iconos más grandes
                    "md:w-20 md:h-10 md:px-2 md:py-2",
                    "sm:border-x sm:first:rounded-tl-lg sm:last:rounded-tr-lg",
                    "data-[state=active]:relative data-[state=active]:z-20 data-[state=active]:border-b-0 data-[state=active]:bg-card data-[state=active]:shadow-sm",
                    !tab.disabled && "cursor-pointer hover:bg-muted/80",
                    tab.disabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span className="flex text-base md:text-xl">
                    <tab.icon aria-hidden="true" />
                  </span>
                </TabsTrigger>
              </Fragment>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
