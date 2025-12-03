"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";

interface LeafPhysics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  swayPhase: number;
  swaySpeed: number;
  element: HTMLDivElement | null;
}

interface LeafStatic {
  id: number;
  color: string;
  scale: number;
}

export function RetroBackground() {
  const [leaves, setLeaves] = useState<LeafStatic[]>([]);
  const physicsRef = useRef<LeafPhysics[]>([]);
  const mouseRef = useRef({
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    lastX: -1000,
    lastY: -1000,
    lastTime: 0,
  });
  const requestRef = useRef<number | undefined>(undefined);

  function createSeededRandom(seed: number) {
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  useEffect(() => {
    const colors = [
      "bg-green-500", // Late Summer
      "bg-yellow-500", // Early Autumn
      "bg-orange-500", // Mid Autumn
      "bg-amber-700", // Late Autumn (Brownish)
      "bg-red-500", // Maple-like
    ];

    // Responsive configuration
    const isMobile = window.innerWidth < 768;
    const leafCount = isMobile ? 12 : 18; // Reduced from 25 (Desktop) / Adjusted for Mobile

    const newLeaves: LeafStatic[] = [];
    const newPhysics: LeafPhysics[] = [];

    for (let i = 0; i < leafCount; i++) {
      newLeaves.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: 0.8 + Math.random() * 0.5,
      });

      newPhysics.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: 0,
        vy: 0.2 + Math.random() * 0.3,
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 0.5,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.001 + Math.random() * 0.002,
        element: null,
      });
    }

    setLeaves(newLeaves);
    physicsRef.current = newPhysics;

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = now - mouseRef.current.lastTime;

      if (dt > 0) {
        const dx = e.clientX - mouseRef.current.lastX;
        const dy = e.clientY - mouseRef.current.lastY;
        mouseRef.current.vx = dx * 0.5;
        mouseRef.current.vy = dy * 0.5;
      }

      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
      mouseRef.current.lastTime = now;
    };

    // Touch support for mobile interaction
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const now = performance.now();
      const dt = now - mouseRef.current.lastTime;

      if (dt > 0) {
        const dx = touch.clientX - mouseRef.current.lastX;
        const dy = touch.clientY - mouseRef.current.lastY;
        mouseRef.current.vx = dx * 0.5;
        mouseRef.current.vy = dy * 0.5;
      }

      mouseRef.current.x = touch.clientX;
      mouseRef.current.y = touch.clientY;
      mouseRef.current.lastX = touch.clientX;
      mouseRef.current.lastY = touch.clientY;
      mouseRef.current.lastTime = now;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Animation Loop
    const animate = (time: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mouse = mouseRef.current;
      const mouseSpeed = Math.sqrt(mouse.vx ** 2 + mouse.vy ** 2);

      // Physics Loop
      for (let i = 0; i < physicsRef.current.length; i++) {
        const leaf = physicsRef.current[i];
        if (!leaf.element) continue;

        // 1. Physics: Gravity
        leaf.vy += 0.005;
        if (leaf.vy > 0.8) leaf.vy = 0.8;

        // 2. Physics: Zig-Zag Sway
        const swayForce =
          Math.sin(time * leaf.swaySpeed + leaf.swayPhase) * 0.02;
        leaf.vx += swayForce;

        // 3. Physics: Leaf Separation
        for (let j = 0; j < physicsRef.current.length; j++) {
          if (i === j) continue;
          const other = physicsRef.current[j];
          const dx = leaf.x - other.x;
          const dy = leaf.y - other.y;
          const distSq = dx * dx + dy * dy;
          const minDist = 80;

          if (distSq < minDist * minDist && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (minDist - dist) / minDist;
            const repulsionX = (dx / dist) * force * 0.05;
            const repulsionY = (dy / dist) * force * 0.05;

            leaf.vx += repulsionX;
            leaf.vy += repulsionY;
          }
        }

        // 4. Physics: Wind/Mouse Interaction (Capped)
        const dx = leaf.x - mouse.x;
        const dy = leaf.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const interactionRadius = 200;

        if (distance < interactionRadius) {
          const force = (interactionRadius - distance) / interactionRadius;

          if (mouseSpeed > 0.5) {
            // Cap the mouse speed influence significantly to limit displacement
            // Max speed cap reduced from 30 to 10
            const cappedMouseSpeed = Math.min(mouseSpeed, 10);
            // Push factor reduced from 0.8 to 0.4
            const pushFactor = 0.4 * force * cappedMouseSpeed;

            leaf.vx += mouse.vx * pushFactor * 0.1;
            leaf.vy += mouse.vy * pushFactor * 0.1;

            leaf.vRotation += (Math.random() - 0.5) * 2 * force;
          }
        }

        // 5. Physics: Drag (High drag prevents excessive travel)
        leaf.vx *= 0.95;
        leaf.vy *= 0.98;
        leaf.vRotation *= 0.98;

        // 6. Update Position & Rotation
        leaf.x += leaf.vx;
        leaf.y += leaf.vy;
        leaf.rotation += leaf.vRotation;

        // 7. Boundary Checks
        if (leaf.y > height + 50) {
          leaf.y = -50;
          leaf.x = Math.random() * width;
          leaf.vy = 0.2 + Math.random() * 0.3;
          leaf.vx = 0;
        }
        if (leaf.x > width + 50) leaf.x = -50;
        if (leaf.x < -50) leaf.x = width + 50;

        // 8. Render
        leaf.element.style.transform = `translate(${leaf.x}px, ${leaf.y}px) rotate(${leaf.rotation}deg) scale(${leaf.element.dataset.scale})`;
      }

      mouse.vx *= 0.9;
      mouse.vy *= 0.9;

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const starStyles = useMemo(() => {
    const rand = createSeededRandom(123456789);
    return Array.from({ length: 100 }).map(() => {
      const top = `${rand() * 100}%`;
      const left = `${rand() * 100}%`;
      const big = rand() > 0.5;
      const width = big ? "3px" : "2px";
      const height = big ? "3px" : "2px";
      const animationDelay = `${rand() * 5}s`;
      const opacity = rand() * 0.5 + 0.4;
      return {
        top,
        left,
        width,
        height,
        animationDelay,
        opacity,
      } as React.CSSProperties;
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050a1f] pointer-events-none font-mono">
      {/* Stars */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.5; }
          }
          .star {
            position: absolute;
            background: white;
            border-radius: 50%;
            animation: twinkle 4s infinite ease-in-out;
          }
        `,
        }}
      />
      {starStyles.map((style, i) => (
        <div key={`star-${i}`} className="star" style={style} />
      ))}

      {/* Leaves */}
      {leaves.map((leaf, index) => (
        <div
          key={leaf.id}
          ref={(el) => {
            if (el && physicsRef.current[index]) {
              physicsRef.current[index].element = el;
            }
          }}
          data-scale={leaf.scale}
          className="absolute top-0 left-0 will-change-transform"
        >
          {/* Pixel Paulownia Leaf (Heart Shape) */}
          <div className="w-10 h-10 relative opacity-90">
            {/* Stem */}
            <div
              className={`absolute -top-1 left-4 w-2 h-3 ${leaf.color} brightness-50`}
            />
            {/* Top Bumps */}
            <div className={`absolute top-1 left-1 w-3 h-2 ${leaf.color}`} />
            <div className={`absolute top-1 left-6 w-3 h-2 ${leaf.color}`} />
            {/* Upper Body */}
            <div className={`absolute top-3 left-0 w-10 h-3 ${leaf.color}`} />
            {/* Middle Body */}
            <div className={`absolute top-6 left-1 w-8 h-2 ${leaf.color}`} />
            {/* Lower Body */}
            <div className={`absolute top-8 left-2 w-6 h-2 ${leaf.color}`} />
            {/* Tip */}
            <div className={`absolute top-10 left-4 w-2 h-2 ${leaf.color}`} />
          </div>
        </div>
      ))}

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-60" />
    </div>
  );
}
