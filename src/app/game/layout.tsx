'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Header } from '@/components/layout/Header';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, mounted, router]);

  if (!mounted) {
    return null; 
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Header />
      <main 
        className="pt-24 px-4 sm:px-6 lg:px-8 mx-auto min-h-screen flex flex-col"
        style={{ 
          maxWidth: '1200px',
          width: '100%'
        }}
      >
        {children}
      </main>
    </div>
  );
}
