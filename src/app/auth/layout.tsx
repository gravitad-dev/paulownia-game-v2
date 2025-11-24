'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const RetroBackground = dynamic(
  () => import('@/components/ui/RetroBackground').then((mod) => mod.RetroBackground),
  { ssr: false }
);

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center text-foreground p-4 relative">
      <RetroBackground />
      <div className="absolute top-12 left-0 w-full text-center z-10">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/brand/Logo.png"
            alt="Paulownia Game Logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Paulownia
          </h2>
        </div>
      </div>
      <div className="w-full max-w-md space-y-8 z-10">
        {children}
      </div>
    </div>
  );
}
