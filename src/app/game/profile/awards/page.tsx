"use client";

import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";

export default function AwardsPage() {
  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Premios" />
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center h-full">
          <p className="text-lg text-muted-foreground">
            Próximamente: Premios
          </p>
        </div>
      </div>
    </div>
  );
}
