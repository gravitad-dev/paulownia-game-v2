"use client";

import { useEffect, useState, useRef } from "react";

export function FpsCounter() {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const measureFPS = () => {
      frameCountRef.current += 1;
      const currentTime = performance.now();
      const delta = currentTime - lastTimeRef.current;

      // Actualizar FPS cada segundo
      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    animationFrameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="px-3 py-3 bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg text-sm font-mono text-white">
      <span className={fps >= 55 ? "text-green-400" : fps >= 30 ? "text-yellow-400" : "text-red-400"}>
        {fps}
      </span>
    </div>
  );
}

