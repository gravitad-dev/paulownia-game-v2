"use client";

import { useState } from "react";
import { useCameraConfigStore } from "@/store/useCameraConfigStore";
import { useGameSpeedStore } from "@/store/useGameSpeedStore";
import { usePuzzleStore } from "@/store/usePuzzleStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, X, RotateCcw } from "lucide-react";

export function CameraConfigPanel() {
  const { config, updateConfig, resetConfig } = useCameraConfigStore();
  const { cycleTime, setCycleTime, resetCycleTime } = useGameSpeedStore();
  const { testMode, setTestMode } = usePuzzleStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof typeof config, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateConfig({ [key]: numValue });
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50"
        title="Configuración"
      >
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-card border border-border rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Configuración</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
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
        </div>

        <div className="pt-2 border-t border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="speed" className="text-sm font-medium">
                Velocidad de Caída
              </Label>
              <span className="text-sm text-muted-foreground">{cycleTime}ms</span>
            </div>
            <Slider
              id="speed"
              value={[cycleTime]}
              onValueChange={([value]) => setCycleTime(value)}
              min={100}
              max={1000}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rápido</span>
              <span>Lento</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <Label htmlFor="testMode" className="text-sm font-medium">
              Modo Test
            </Label>
            <Checkbox
              id="testMode"
              checked={testMode}
              onCheckedChange={(checked) => setTestMode(checked === true)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Activa solo piezas puzzle y permite atajos G (ganar) / P (perder)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={resetConfig}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetear Cámara
        </Button>
        <Button
          variant="outline"
          onClick={resetCycleTime}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetear Velocidad
        </Button>
      </div>
    </div>
  );
}

