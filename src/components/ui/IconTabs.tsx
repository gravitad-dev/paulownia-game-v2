"use client";

import { Fragment, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import gsap from "gsap";

export type TabGroup = string;

export interface IconTab {
  value: string;
  label: string;
  icon: IconType;
  group?: TabGroup;
  disabled?: boolean;
  showBadge?: boolean;
}

export interface IconTabsProps {
  tabs: IconTab[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  /**
   * Si es true, muestra labels en desktop (>= md)
   * Si es false, solo muestra iconos en todos los tamaños
   * @default false
   */
  showLabelsOnDesktop?: boolean;
  /**
   * Animación GSAP al cambiar de tab
   * @default true
   */
  animate?: boolean;
}

/**
 * Componente de tabs con iconos reutilizable
 *
 * Características:
 * - Mobile/Tablet: Muestra solo iconos (40x40px), la tab activa se expande
 * - Desktop (opcional): Puede mostrar labels junto a los iconos
 * - Soporta agrupación de tabs con separadores visuales
 * - Animaciones GSAP opcionales
 * - Tabs deshabilitadas
 *
 * @example
 * ```tsx
 * const tabs: IconTab[] = [
 *   { value: 'home', label: 'Inicio', icon: LuHome, group: 'main' },
 *   { value: 'settings', label: 'Configuración', icon: LuSettings, group: 'config' },
 * ];
 *
 * <IconTabs
 *   tabs={tabs}
 *   value={currentTab}
 *   onValueChange={setCurrentTab}
 *   showLabelsOnDesktop
 * />
 * ```
 */
export function IconTabs({
  tabs,
  value,
  onValueChange,
  className,
  showLabelsOnDesktop = false,
  animate = true,
}: IconTabsProps) {
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const previousTabRef = useRef<string | null>(null);

  useEffect(() => {
    // Animar la tab activa cuando cambia
    if (animate && activeTabRef.current && previousTabRef.current !== value) {
      gsap.fromTo(
        activeTabRef.current,
        {
          scale: 0.95,
        },
        {
          scale: 1,
          duration: 0.2,
          ease: "back.out(1.2)",
        },
      );
      previousTabRef.current = value;
    }
  }, [value, animate]);

  const handleChange = (newValue: string) => {
    const tab = tabs.find((tab) => tab.value === newValue);
    if (tab && !tab.disabled) {
      onValueChange(newValue);
    }
  };

  return (
    <div className="relative z-10 w-full">
      <Tabs
        value={value}
        onValueChange={handleChange}
        className={cn("w-full", className)}
      >
        <TabsList className="relative flex w-full flex-nowrap justify-start gap-0 rounded-none border-0 bg-transparent px-2 py-0 scrollbar-hide sm:gap-2 sm:px-2">
          {tabs.map((tab, index) => {
            const previousGroup = tabs[index - 1]?.group;
            const showSeparator =
              previousGroup && tab.group && previousGroup !== tab.group;

            return (
              <Fragment key={tab.value}>
                {showSeparator && (
                  <span className="mx-0.5 hidden h-6 w-px bg-border/60 sm:mx-1 sm:block" />
                )}
                <TabsTrigger
                  ref={tab.value === value ? activeTabRef : null}
                  value={tab.value}
                  disabled={tab.disabled}
                  aria-label={tab.label}
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-t-lg rounded-b-none border-x-0 border-t border-b-0 border-border/60 bg-muted/70 transition-all first:border-l last:border-r first:rounded-tl-lg last:rounded-tr-lg overflow-visible z-30",
                    // Mobile/Tablet (< md): Tab inactiva 40x40px (cubo), activa se expande
                    "flex-initial w-10 h-10 px-1 py-1",
                    "data-[state=active]:w-20 data-[state=active]:h-10 data-[state=active]:px-2 data-[state=active]:py-2",
                    // Desktop (>= md): Tamaño base según si muestra labels
                    showLabelsOnDesktop
                      ? "md:w-auto md:min-w-[120px] md:max-w-[200px] md:h-10 md:px-3 md:py-2"
                      : "md:w-20 md:h-10 md:px-2 md:py-2",
                    "sm:border-x sm:first:rounded-tl-lg sm:last:rounded-tr-lg",
                    "data-[state=active]:relative data-[state=active]:z-20 data-[state=active]:border-b-0 data-[state=active]:bg-card data-[state=active]:shadow-sm",
                    !tab.disabled && "cursor-pointer hover:bg-muted/80",
                    tab.disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex text-base md:text-xl",
                      showLabelsOnDesktop && "md:text-lg",
                    )}
                  >
                    <tab.icon aria-hidden="true" />
                  </span>
                  {showLabelsOnDesktop && tab.value !== value && (
                    <span className="hidden text-sm font-medium md:inline whitespace-nowrap overflow-hidden text-ellipsis">
                      {tab.label}
                    </span>
                  )}

                  {tab.showBadge && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-10">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                    </span>
                  )}
                </TabsTrigger>
              </Fragment>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
