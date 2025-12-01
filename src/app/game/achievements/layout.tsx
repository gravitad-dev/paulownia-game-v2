"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabLayout } from "@/components/ui/TabLayout";
import { IconTab } from "@/components/ui/IconTabs";
import { Trophy } from "lucide-react";

interface AchievementTab extends IconTab {
  href: string;
}

const achievementTabs: AchievementTab[] = [
  {
    value: "achievements",
    label: "Logros",
    href: "/game/achievements",
    icon: Trophy,
  },
];

const getCurrentTab = (pathname: string): string => {
  if (pathname === "/game/achievements") return "achievements";
  return "achievements";
};

export default function AchievementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentTab = getCurrentTab(pathname);

  const handleTabChange = (value: string) => {
    const tab = achievementTabs.find((tab) => tab.value === value);
    if (tab) {
      router.push(tab.href);
    }
  };

  return (
    <TabLayout
      tabs={achievementTabs}
      value={currentTab}
      onValueChange={handleTabChange}
      showLabelsOnDesktop
    >
      {children}
    </TabLayout>
  );
}

