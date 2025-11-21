import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4 relative">
      <div className="absolute top-12 left-0 w-full text-center">
        <h2 className="text-4xl font-bold tracking-tight text-primary">
          Paulownia Game
        </h2>
      </div>
      <div className="w-full max-w-md space-y-8">
        {children}
      </div>
    </div>
  );
}
