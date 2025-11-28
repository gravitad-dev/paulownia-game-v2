"use client";

import { Gift } from "lucide-react";

export default function CatalogPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="text-center max-w-md">
        <div className="inline-block mb-6">
          <div className="p-6 bg-linear-to-br from-primary/20 to-primary/5 rounded-full">
            <Gift className="h-16 w-16 text-primary" />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">Catálogo de Premios</h2>
        <p className="text-muted-foreground mb-6">
          Aquí podrás ver todos los premios disponibles que puedes ganar usando
          tus tickets en la ruleta.
        </p>

        <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Próximamente:</span>{" "}
            El catálogo de premios estará disponible muy pronto. ¡Prepárate para
            descubrir increíbles recompensas!
          </p>
        </div>
      </div>
    </div>
  );
}
