"use client";

import { IconTab } from "@/components/ui/IconTabs";
import { TabLayout } from "@/components/ui/TabLayout";
import { ArrowLeftRight, Gift, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface RewardTab extends IconTab {
  href: string;
}

const rewardTabs: RewardTab[] = [
  {
    value: "exchange",
    label: "Canjear",
    href: "/game/rewards",
    icon: ArrowLeftRight,
  },
  {
    value: "discover",
    label: "Descubrir",
    href: "/game/rewards/discover",
    icon: Sparkles,
  },
  {
    value: "catalog",
    label: "Catálogo",
    href: "/game/rewards/catalog",
    icon: Gift,
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

  const currentTab = getTabFromPathname(pathname);

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
    >
      {children}
    </TabLayout>
  );
}
