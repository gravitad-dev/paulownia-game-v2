"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabLayout } from "@/components/ui/TabLayout";
import { IconTab } from "@/components/ui/IconTabs";
import { Gift, Calendar } from "lucide-react";
import {
  useDailyRewardsStore,
  useAvailableReward,
} from "@/store/useDailyRewardsStore";
import { CountdownTimer } from "@/components/game/rewards";

interface EventTab extends IconTab {
  href: string;
}

const getCurrentTab = (pathname: string): string => {
  if (pathname === "/game/events/upcoming") return "upcoming";
  return "daily-rewards";
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const canClaimDailyReward = useDailyRewardsStore((state) => state.canClaim);
  const nextClaimDate = useDailyRewardsStore((state) => state.nextClaimDate);
  const availableReward = useAvailableReward();
  const currentTab = getCurrentTab(pathname);

  const eventTabs: EventTab[] = [
    {
      value: "daily-rewards",
      label: "Recompensas Diarias",
      href: "/game/events",
      icon: Gift,
      showBadge: canClaimDailyReward,
    },
    {
      value: "upcoming",
      label: "Próximos Eventos",
      href: "/game/events/upcoming",
      icon: Calendar,
    },
  ];

  const handleTabChange = (value: string) => {
    const tab = eventTabs.find((tab) => tab.value === value);
    if (tab) {
      router.push(tab.href);
    }
  };

  const handleCountdownComplete = () => {
    // Refrescar estado cuando el countdown termine
    useDailyRewardsStore.getState().fetchStatus();
  };

  // Título y subtítulo dinámicos para la tab de daily rewards
  const isDailyRewards = currentTab === "daily-rewards";
  const title = isDailyRewards ? "Recompensas Diarias" : "Próximos Eventos";

  let subtitle = "";
  let headerAction = null;

  if (isDailyRewards) {
    if (canClaimDailyReward && availableReward) {
      subtitle = `¡Tu recompensa del Día ${availableReward.day} está lista para ser reclamada!`;
    } else if (nextClaimDate) {
      subtitle = "Ya has reclamado tu recompensa de hoy.";
      headerAction = (
        <CountdownTimer
          targetDate={nextClaimDate}
          onComplete={handleCountdownComplete}
          className=""
        />
      );
    } else {
      subtitle =
        "¡Completaste la racha de 7 días! Has reclamado todas las recompensas.";
    }
  } else {
    subtitle = "Descubre los eventos especiales que están por venir.";
  }

  return (
    <TabLayout
      tabs={eventTabs}
      value={currentTab}
      onValueChange={handleTabChange}
      showLabelsOnDesktop
      title={title}
      subtitle={subtitle}
      headerAction={headerAction}
    >
      {children}
    </TabLayout>
  );
}
