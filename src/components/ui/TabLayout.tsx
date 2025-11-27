"use client";

import { useEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { IconTabs, IconTab } from "@/components/ui/IconTabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
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
  /**
   * Título opcional con icono
   */
  title?: string;
  /**
   * Icono para el título
   */
  titleIcon?: LucideIcon;
  /**
   * Subtítulo opcional (gris, pequeño, descriptivo)
   */
  subtitle?: string;
  /**
   * Componente adicional para mostrar en el header (ej: countdown)
   */
  headerAction?: ReactNode;
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
  title,
  titleIcon: TitleIcon,
  subtitle,
  headerAction,
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
        {(title || subtitle || headerAction) && (
          <CardHeader className="pt-4 pb-2 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                {title && (
                  <div className="flex items-center gap-2">
                    {TitleIcon && (
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <TitleIcon className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <CardTitle className="text-lg sm:text-xl">
                      {title}
                    </CardTitle>
                  </div>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-accent-foreground mt-0.5 leading-snug">
                    {subtitle}
                  </p>
                )}
              </div>
              {headerAction && (
                <div className="shrink-0 flex justify-center sm:justify-end">
                  {headerAction}
                </div>
              )}
            </div>
          </CardHeader>
        )}
        <div ref={contentRef} className="flex-1 overflow-y-auto" key={pathname}>
          {children}
        </div>
      </Card>
    </div>
  );
}
