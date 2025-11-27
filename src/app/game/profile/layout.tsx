"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabLayout } from "@/components/ui/TabLayout";
import { IconTab } from "@/components/ui/IconTabs";
import {
  LuAward,
  LuBell,
  LuMedal,
  LuRefreshCw,
  LuSettings,
  LuTarget,
  LuUser,
} from "react-icons/lu";

interface ProfileTab extends IconTab {
  href: string;
  group: "public" | "settings";
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
  const sortedTabs = [...profileTabs].sort(
    (a, b) => b.href.length - a.href.length,
  );
  const match = sortedTabs.find(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
  );
  return match ? match.value : "profile";
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentTab = getCurrentTab(pathname);

  const handleTabChange = (value: string) => {
    const tab = profileTabs.find((tab) => tab.value === value);
    if (tab && !tab.disabled) {
      router.push(tab.href);
    }
  };

  return (
    <TabLayout
      tabs={profileTabs}
      value={currentTab}
      onValueChange={handleTabChange}
    >
      {children}
    </TabLayout>
  );
}
