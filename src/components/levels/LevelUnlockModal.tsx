"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getStrapiImageUrl } from "@/lib/image-utils";

interface LevelUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelName: string;
  coverImageUrl?: string | null;
  onUnlock: (password: string) => Promise<void>;
}

export function LevelUnlockModal({
  open,
  onOpenChange,
  levelName,
  coverImageUrl,
  onUnlock,
}: LevelUnlockModalProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;

    try {
      setIsLoading(true);
      await onUnlock(password);
      setPassword("");
      onOpenChange(false);
    } catch (error) {
      // El error se maneja en el componente padre
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && !isLoading) {
      setPassword("");
    }
    onOpenChange(open);
  };

  const coverUrl = coverImageUrl ? getStrapiImageUrl(coverImageUrl) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 [&>button]:z-20 [&>button]:bg-background/80 [&>button]:backdrop-blur-sm [&>button]:rounded-full [&>button]:p-1">
        {coverUrl && (
          <div className="relative w-full h-32 sm:h-40 overflow-hidden rounded-t-lg">
            <Image
              src={coverUrl}
              alt={levelName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 500px"
            />
            <div className="absolute inset-0 bg-linear-to-br from-black/80 to-[#0B7431]/60 pointer-events-none" />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 pointer-events-none">
              <DialogHeader>
                <DialogTitle className="text-white text-center text-xl sm:text-2xl font-bold drop-shadow-lg">
                  Desbloquear Nivel
                </DialogTitle>
                <DialogDescription className="text-white/90 text-center text-sm sm:text-base mt-2 drop-shadow-md">
                  Ingresa la contraseña para desbloquear {levelName}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        )}

        <div className="p-6">
          {!coverUrl && (
            <DialogHeader className="pb-2">
              <DialogTitle>Desbloquear Nivel</DialogTitle>
              <DialogDescription>
                Ingresa la contraseña para desbloquear {levelName}
              </DialogDescription>
            </DialogHeader>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={!password.trim() || isLoading}
                className="w-[45%] h-[40px] flex items-center justify-center text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
