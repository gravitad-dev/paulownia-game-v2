"use client";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScoresPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] sm:h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-10rem)]">
      <ProfileTabs />
      <Card className="flex-1 flex flex-col rounded-b-lg border border-border/60 shadow-lg overflow-hidden">
        <CardHeader className="space-y-0 p-0 shrink-0 border-b border-border/50">
          <div className="flex flex-row items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-3">
            <CardTitle className="text-lg font-semibold sm:text-xl">
              Puntajes
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          <div className="flex flex-col items-center justify-center text-center h-full">
            <p className="text-lg text-muted-foreground">
              Próximamente: Puntajes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

