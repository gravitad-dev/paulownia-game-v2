"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabLayout } from "@/components/ui/TabLayout";
import { IconTab } from "@/components/ui/IconTabs";
import { Layers } from "lucide-react";

interface LevelTab extends IconTab {
  href: string;
}

const levelTabs: LevelTab[] = [
  {
    value: "levels",
    label: "Niveles",
    href: "/game/levels",
    icon: Layers,
  },
];

const getCurrentTab = (pathname: string): string => {
  // Cualquier ruta bajo /game/levels mantiene seleccionada la tab de niveles
  if (pathname.startsWith("/game/levels")) return "levels";
  return "levels";
};

export default function LevelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Detectar si estamos en una ruta de [levelId]
  // Las rutas de levelId tienen el formato /game/levels/[uuid]
  const isLevelIdRoute = pathname.match(/^\/game\/levels\/[^/]+$/);

  // Si estamos en una ruta de levelId, retornar solo los children sin TabLayout
  if (isLevelIdRoute) {
    return <>{children}</>;
  }

  const currentTab = getCurrentTab(pathname);

  const handleTabChange = (value: string) => {
    const tab = levelTabs.find((tab) => tab.value === value);
    if (tab) {
      router.push(tab.href);
    }
  };

  return (
    <TabLayout
      tabs={levelTabs}
      value={currentTab}
      onValueChange={handleTabChange}
      showLabelsOnDesktop
    >
      {children}
    </TabLayout>
  );
}


