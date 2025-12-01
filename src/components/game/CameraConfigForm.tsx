"use client";

import { useCameraConfigStore } from "@/store/useCameraConfigStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

export function CameraConfigForm() {
  const { config, updateConfig, resetConfig } = useCameraConfigStore();

  const handleChange = (key: keyof typeof config, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateConfig({ [key]: numValue });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fov">Campo de Visión (FOV)</Label>
        <Input
          id="fov"
          type="number"
          min="50"
          max="120"
          step="1"
          value={config.fov}
          onChange={(e) => handleChange("fov", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Controla el ángulo de visión de la cámara (50-120)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zoom">Zoom</Label>
        <Input
          id="zoom"
          type="number"
          min="1.0"
          max="10.0"
          step="0.1"
          value={config.zoom}
          onChange={(e) => handleChange("zoom", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Controla el nivel de acercamiento (1.0-10.0)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="heightMultiplier">Multiplicador de Altura</Label>
        <Input
          id="heightMultiplier"
          type="number"
          min="1.0"
          max="3.0"
          step="0.1"
          value={config.heightMultiplier}
          onChange={(e) => handleChange("heightMultiplier", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Controla la altura de la cámara respecto al tamaño del grid (1.0-3.0)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="distanceMultiplier">Multiplicador de Distancia</Label>
        <Input
          id="distanceMultiplier"
          type="number"
          min="0.3"
          max="2.0"
          step="0.1"
          value={config.distanceMultiplier}
          onChange={(e) => handleChange("distanceMultiplier", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Controla la distancia horizontal de la cámara (0.3-2.0)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="offset">Offset</Label>
        <Input
          id="offset"
          type="number"
          min="0"
          max="10"
          step="0.5"
          value={config.offset}
          onChange={(e) => handleChange("offset", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Controla el offset para la vista frontal (0-10)
        </p>
      </div>

      <Button
        variant="outline"
        onClick={resetConfig}
        className="w-full"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Resetear a Valores por Defecto
      </Button>
    </div>
  );
}

