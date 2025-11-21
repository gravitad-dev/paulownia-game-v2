'use client';

export default function SettingsPage() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground">
          Configura las opciones del juego y la aplicación.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Próximamente: Configuración de audio, gráficos y notificaciones.
        </div>
      </div>
    </div>
  );
}
