'use client';

import { Card } from "@/components/ui/card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CameraConfigForm } from "@/components/game/CameraConfigForm";

export default function SettingsPage() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground">
          Configura las opciones del juego y la aplicación.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Cámara</CardTitle>
        </CardHeader>
        <CardContent>
          <CameraConfigForm />
        </CardContent>
      </Card>
    </div>
  );
}
