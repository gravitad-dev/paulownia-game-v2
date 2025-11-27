"use client";

import { useEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { IconTabs, IconTab } from "@/components/ui/IconTabs";
import { Card } from "@/components/ui/card";
import gsap from "gsap";

export interface TabLayoutProps {
  tabs: IconTab[];
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  /**
   * Si es true, muestra labels en desktop (>= md)
   * @default false
   */
  showLabelsOnDesktop?: boolean;
  /**
   * Clase adicional para el contenedor principal
   */
  className?: string;
  /**
   * Clase adicional para las tabs
   */
  tabsClassName?: string;
  /**
   * Habilita animación GSAP al cambiar de contenido
   * @default true
   */
  animateContent?: boolean;
}

/**
 * Layout completo con tabs superiores y contenido animado
 *
 * Proporciona la estructura completa de tabs + contenedor card con animaciones.
 * El contenido se anima automáticamente al cambiar de ruta.
 *
 * @example
 * ```tsx
 * const tabs = [
 *   { value: 'profile', label: 'Perfil', icon: LuUser },
 *   { value: 'settings', label: 'Configuración', icon: LuSettings },
 * ];
 *
 * <TabLayout
 *   tabs={tabs}
 *   value={currentTab}
 *   onValueChange={handleTabChange}
 * >
 *   {children}
 * </TabLayout>
 * ```
 */
export function TabLayout({
  tabs,
  value,
  onValueChange,
  children,
  showLabelsOnDesktop = false,
  className = "",
  tabsClassName = "",
  animateContent = true,
}: TabLayoutProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animateContent && contentRef.current) {
      // Animación de entrada: fade in + translateY ligero
      gsap.fromTo(
        contentRef.current,
        {
          opacity: 0,
          y: 10,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        },
      );
    }
  }, [pathname, animateContent]);

  return (
    <div
      className={`flex flex-col h-[calc(100vh-9rem)] sm:h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-10rem)] ${className}`}
    >
      <IconTabs
        tabs={tabs}
        value={value}
        onValueChange={onValueChange}
        showLabelsOnDesktop={showLabelsOnDesktop}
        className={tabsClassName}
      />
      <Card className="relative z-20 flex-1 flex flex-col -mt-px rounded-b-lg border-t-0 border-x border-b border-border/60 shadow-lg overflow-hidden">
        <div ref={contentRef} className="flex-1 overflow-y-auto" key={pathname}>
          {children}
        </div>
      </Card>
    </div>
  );
}
