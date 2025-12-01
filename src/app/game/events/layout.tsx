"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabLayout } from "@/components/ui/TabLayout";
import { IconTab } from "@/components/ui/IconTabs";
import { Gift, Calendar } from "lucide-react";
import { useDailyRewardsStore } from "@/store/useDailyRewardsStore";

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
  const currentTab = getCurrentTab(pathname);
  const canClaimDailyReward = useDailyRewardsStore((state) => state.canClaim);

  const eventTabs: EventTab[] = [
    {
      value: "daily-rewards",
      label: "Diarias",
      href: "/game/events",
      icon: Gift,
      showBadge: canClaimDailyReward,
    },
    {
      value: "upcoming",
      label: "Eventos",
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

  return (
    <TabLayout
      tabs={eventTabs}
      value={currentTab}
      onValueChange={handleTabChange}
      showLabelsOnDesktop
    >
      {children}
    </TabLayout>
  );
}
