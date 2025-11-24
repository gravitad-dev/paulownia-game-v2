"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Card } from "@/components/ui/card";
import gsap from "gsap";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
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
        }
      );
    }
  }, [pathname]);

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] sm:h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-10rem)]">
      <ProfileTabs />
      <Card className="relative z-20 flex-1 flex flex-col -mt-px rounded-b-lg border-t-0 border-x border-b border-border/60 shadow-lg overflow-hidden">
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto"
          key={pathname}
        >
          {children}
        </div>
      </Card>
    </div>
  );
}

