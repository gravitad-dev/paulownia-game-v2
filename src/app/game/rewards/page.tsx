"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Premios</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí encontrarás todos los premios que has ganado y los que puedes
            obtener.
          </p>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Contenido en desarrollo...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

