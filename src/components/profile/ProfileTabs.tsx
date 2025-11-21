'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ProfileTab {
  value: string;
  label: string;
  href: string;
  disabled?: boolean;
}

const profileTabs: ProfileTab[] = [
  { value: 'profile', label: 'Perfil', href: '/game/profile' },
  {
    value: 'settings',
    label: 'Configuración',
    href: '/game/profile/settings',
    disabled: true,
  },
  {
    value: 'history',
    label: 'Historial',
    href: '/game/profile/history',
    disabled: true,
  },
];

const getCurrentTab = (pathname: string): string => {
  const match = profileTabs.find((tab) => pathname.startsWith(tab.href));
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
        <TabsList className="relative w-full justify-start gap-2 overflow-x-auto overflow-y-hidden rounded-none border-0 bg-transparent px-2 pb-0">
          {profileTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(
                'min-w-[100px] rounded-t-lg rounded-b-none border border-border/60 bg-muted/30 px-3 py-2 text-sm transition-all sm:px-4 sm:py-2.5',
                'data-[state=active]:relative data-[state=active]:z-30 data-[state=active]:-mb-px data-[state=active]:border-b-0 data-[state=active]:bg-card data-[state=active]:shadow-sm',
                tab.disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

