'use client';

import { Fragment } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  LuAward,
  LuMedal,
  LuRefreshCw,
  LuSettings,
  LuTarget,
  LuUser,
} from 'react-icons/lu';
import { IconType } from 'react-icons';

type ProfileTabGroup = 'public' | 'settings';

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
    value: 'profile',
    label: 'Perfil',
    href: '/game/profile',
    icon: LuUser,
    group: 'public',
  },
  {
    value: 'scores',
    label: 'Puntajes',
    href: '/game/profile/scores',
    icon: LuTarget,
    group: 'public',
  },
  {
    value: 'awards',
    label: 'Premios',
    href: '/game/profile/awards',
    icon: LuAward,
    group: 'public',
  },
  {
    value: 'achievements',
    label: 'Logros',
    href: '/game/profile/achievements',
    icon: LuMedal,
    group: 'public',
  },
  {
    value: 'changes',
    label: 'Cambios',
    href: '/game/profile/changes',
    icon: LuRefreshCw,
    group: 'public',
  },
  {
    value: 'settings',
    label: 'Configuración',
    href: '/game/profile/settings',
    icon: LuSettings,
    group: 'settings',
  },
];

const getCurrentTab = (pathname: string): string => {
  // Ordenar tabs por longitud de href descendente para que las rutas más específicas se evalúen primero
  const sortedTabs = [...profileTabs].sort((a, b) => b.href.length - a.href.length);
  const match = sortedTabs.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`));
  return match ? match.value : 'profile';
};

export function ProfileTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentTab = getCurrentTab(pathname);

  const handleChange = (value: string) => {
    const tab = profileTabs.find((tab) => tab.value === value);
    if (tab && !tab.disabled) {
      router.push(tab.href);
    }
  };

  return (
    <div className="relative z-20">
      <Tabs
        value={currentTab}
        onValueChange={handleChange}
        className={cn('w-full', className)}
      >
        <TabsList className="relative flex w-full flex-nowrap justify-start gap-2 overflow-x-auto overflow-y-hidden rounded-none border-0 bg-transparent px-2 pb-0 scrollbar-hide">
          {profileTabs.map((tab, index) => {
            const previousGroup = profileTabs[index - 1]?.group;
            const showSeparator = previousGroup && previousGroup !== tab.group;

            return (
              <Fragment key={tab.value}>
                {showSeparator && (
                  <span className="mx-1 hidden h-6 w-px bg-border/60 sm:block" />
                )}
                <TabsTrigger
                  value={tab.value}
                  disabled={tab.disabled}
                  aria-label={tab.label}
                  className={cn(
                    'flex min-w-[56px] shrink-0 items-center justify-center gap-2 rounded-t-lg rounded-b-none border border-border/60 bg-muted/70 px-3 py-1.5 text-xs transition-all sm:min-w-[120px] sm:px-4 sm:py-2 sm:text-sm',
                    'data-[state=active]:relative data-[state=active]:z-30 data-[state=active]:-mb-px data-[state=active]:border-b-0 data-[state=active]:bg-card data-[state=active]:shadow-sm',
                    !tab.disabled && 'cursor-pointer hover:bg-muted/80',
                    tab.disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <span className="flex text-base sm:hidden">
                    <tab.icon aria-hidden="true" />
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              </Fragment>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}

