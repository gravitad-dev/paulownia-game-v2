"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  className?: string;
}

export function HeroCard({ className }: HeroCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const beeRef = useRef<HTMLDivElement>(null);
  const sockRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      // Timeline principal
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Animación de entrada de la card
      tl.fromTo(
        cardRef.current,
        { opacity: 0, y: 50, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8 }
      );

      // Animación del título con efecto de escritura
      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, y: 30, letterSpacing: "0.5em" },
          { opacity: 1, y: 0, letterSpacing: "0.02em", duration: 0.7 },
          "-=0.4"
        );
      }

      // Animación del subtítulo
      if (subtitleRef.current) {
        tl.fromTo(
          subtitleRef.current,
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.5 },
          "-=0.3"
        );
      }

      // Animación de la descripción
      if (descriptionRef.current) {
        tl.fromTo(
          descriptionRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.2"
        );
      }

      // Animación del badge
      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, scale: 0, rotation: -180 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.6,
            ease: "back.out(1.7)",
          },
          "-=0.3"
        );
      }

      // Animación de la abeja - entrada desde la derecha con vuelo
      if (beeRef.current) {
        tl.fromTo(
          beeRef.current,
          { opacity: 0, x: 100, y: -50, rotation: 15 },
          {
            opacity: 1,
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.5"
        );

        // Animación flotante continua de la abeja
        gsap.to(beeRef.current, {
          y: "+=10",
          rotation: 5,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.5,
        });

        // Movimiento lateral sutil
        gsap.to(beeRef.current, {
          x: "+=8",
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.5,
        });
      }

      // Animación del sock - entrada desde abajo con rebote
      if (sockRef.current) {
        tl.fromTo(
          sockRef.current,
          { opacity: 0, y: 80, rotation: -20 },
          {
            opacity: 1,
            y: 0,
            rotation: 0,
            duration: 0.7,
            ease: "back.out(1.4)",
          },
          "-=0.6"
        );

        // Animación flotante continua del sock
        gsap.to(sockRef.current, {
          y: "+=8",
          rotation: 5,
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 2,
        });
      }
    }, cardRef);

    return () => ctx.revert();
  }, []);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-2xl border-0 shadow-2xl",
        "min-h-[280px] sm:min-h-80 md:min-h-[360px]",
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg-banner.webp"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay gradient para mejor legibilidad - tono verde oscuro */}
        <div className="absolute inset-0 bg-linear-to-r from-[#030613]/90 via-[#062E19]/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#030613]/80 via-transparent to-[#062E19]/20" />
      </div>

      {/* Decorative Elements */}
      {/* Bee - positioned top right */}
      <div
        ref={beeRef}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-12 z-10 opacity-0"
      >
        <Image
          src="/images/bee.svg"
          alt="Bee decoration"
          width={60}
          height={60}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 drop-shadow-lg"
        />
      </div>

      {/* Sock - positioned bottom right */}
      <div
        ref={sockRef}
        className="absolute bottom-4 right-8 sm:bottom-6 sm:right-16 md:bottom-8 md:right-24 z-10 opacity-0"
      >
        <Image
          src="/images/sock.png"
          alt="Sock decoration"
          width={80}
          height={80}
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 drop-shadow-xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col justify-center h-full p-6 sm:p-8 md:p-12">
        <div className="max-w-xl">
          {/* Badge */}
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-medium text-amber-200 bg-amber-500/20 backdrop-blur-sm rounded-full border border-amber-400/30 opacity-0"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Juego disponible
          </div>

          {/* Title */}
          <h1
            ref={titleRef}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 tracking-tight opacity-0"
            style={{
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
              fontFamily: "var(--font-heading, inherit)",
            }}
          >
            Paulownia
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="text-lg sm:text-xl md:text-2xl font-semibold text-amber-300 mb-4 opacity-0"
          >
            El puzzle arcade que desafía tu mente
          </p>

          {/* Description */}
          <p
            ref={descriptionRef}
            className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-md opacity-0"
          >
            Sumérgete en un mundo de desafíos donde cada nivel pone a prueba tu
            agilidad mental y reflejos. Compite con jugadores de todo el mundo,
            sube en el ranking y demuestra que eres el mejor.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs text-gray-400">Ranking global</p>
                <p className="font-semibold">Top 100</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-xs text-gray-400">Niveles</p>
                <p className="font-semibold">50+</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-xs text-gray-400">Recompensas</p>
                <p className="font-semibold">Diarias</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative particles/glow */}
      <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
    </Card>
  );
}
