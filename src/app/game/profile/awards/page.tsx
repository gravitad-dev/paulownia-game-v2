"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AwardsPage() {
  return (
    <>
      <CardHeader className="space-y-0 p-0 shrink-0 border-b border-border/50">
        <div className="flex flex-row items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-3">
          <CardTitle className="text-lg font-semibold sm:text-xl">
            Premios
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-6">
        <div className="flex flex-col items-center justify-center text-center h-full">
          <p className="text-lg text-muted-foreground">
            Próximamente: Premios
          </p>
        </div>
      </CardContent>
    </>
  );
}

