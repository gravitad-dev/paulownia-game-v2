"use client";

import { IconTab } from "@/components/ui/IconTabs";
import { TabLayout } from "@/components/ui/TabLayout";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";
import { ArrowLeftRight, Gift, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface RewardTab extends IconTab {
  href: string;
  getContent: (stats: { coins?: number; tickets?: number } | null) => {
    title: string;
    subtitle: string;
  };
}

const rewardTabs: RewardTab[] = [
  {
    value: "exchange",
    label: "Canjear",
    href: "/game/rewards",
    icon: ArrowLeftRight,
    getContent: (stats) => ({
      title: "Canjear Monedas",
      subtitle:
        "Convierte tus monedas en tickets para participar en los premios",
    }),
  },
  {
    value: "discover",
    label: "Descubrir",
    href: "/game/rewards/discover",
    icon: Sparkles,
    getContent: (stats) => ({
      title: "Descubrir Premio",
      subtitle: stats?.tickets
        ? `Tienes ${stats.tickets} ticket${
            stats.tickets !== 1 ? "s" : ""
          } disponible${stats.tickets !== 1 ? "s" : ""} para descubrir premios`
        : "Consigue tickets para descubrir premios increíbles",
    }),
  },
  {
    value: "catalog",
    label: "Catálogo",
    href: "/game/rewards/catalog",
    icon: Gift,
    getContent: () => ({
      title: "Catálogo de Premios",
      subtitle: "Explora todos los premios que puedes ganar",
    }),
  },
];

// Genera el mapa de rutas automáticamente desde el array
const getTabFromPathname = (pathname: string): RewardTab => {
  const tab = rewardTabs.find((t) => t.href === pathname);
  return tab || rewardTabs[0]; // Default a la primera tab
};

export default function RewardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const playerStats = usePlayerStatsStore((state) => state.stats);

  const currentTab = getTabFromPathname(pathname);
  const { title, subtitle } = currentTab.getContent(playerStats);

  const handleTabChange = (value: string) => {
    const tab = rewardTabs.find((t) => t.value === value);
    if (tab) {
      router.push(tab.href);
    }
  };

  return (
    <TabLayout
      tabs={rewardTabs}
      value={currentTab.value}
      onValueChange={handleTabChange}
      showLabelsOnDesktop
      title={title}
      subtitle={subtitle}
    >
      {children}
    </TabLayout>
  );
}
