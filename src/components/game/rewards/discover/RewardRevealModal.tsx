"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Gift,
  Coins,
  Ticket,
  Package,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Reward, UserReward } from "@/types/reward";

interface RewardRevealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Reward | null;
  userReward: UserReward | null;
  onClose: () => void;
}

/**
 * Modal para revelar el premio ganado
 */
export function RewardRevealModal({
  open,
  onOpenChange,
  reward,
  userReward,
  onClose,
}: RewardRevealModalProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open) {
      // Pequeño delay para efecto de revelación
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [open]);

  if (!reward || !userReward) return null;

  const getRewardIcon = () => {
    switch (reward.typeReward) {
      case "currency":
        return reward.name.toLowerCase().includes("coin") ? (
          <Coins className="h-12 w-12 text-amber-500" />
        ) : (
          <Ticket className="h-12 w-12 text-blue-500" />
        );
      case "consumable":
        return <Package className="h-12 w-12 text-green-500" />;
      case "cosmetic":
        return <Sparkles className="h-12 w-12 text-purple-500" />;
      default:
        return <Gift className="h-12 w-12 text-primary" />;
    }
  };

  const getRewardColor = () => {
    switch (reward.typeReward) {
      case "currency":
        return reward.name.toLowerCase().includes("coin")
          ? "from-amber-500/20 to-amber-500/5 border-amber-500/30"
          : "from-blue-500/20 to-blue-500/5 border-blue-500/30";
      case "consumable":
        return "from-green-500/20 to-green-500/5 border-green-500/30";
      case "cosmetic":
        return "from-purple-500/20 to-purple-500/5 border-purple-500/30";
      default:
        return "from-primary/20 to-primary/5 border-primary/30";
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <PartyPopper className="h-6 w-6" />
            <span>¡Felicidades!</span>
          </DialogTitle>
          <DialogDescription>Has ganado un premio</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "flex flex-col items-center gap-6 py-6 transition-all duration-500",
            showContent ? "opacity-100 scale-100" : "opacity-0 scale-95",
          )}
        >
          {/* Icono/Imagen del premio */}
          <div
            className={cn(
              "p-6 rounded-full bg-linear-to-br border-2",
              getRewardColor(),
            )}
          >
            {reward.image?.url ? (
              <Image
                src={reward.image.url}
                alt={reward.name}
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
              />
            ) : (
              getRewardIcon()
            )}
          </div>

          {/* Info del premio */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">{reward.name}</h3>
            {reward.description && (
              <p className="text-sm text-muted-foreground max-w-xs">
                {reward.description}
              </p>
            )}
            {userReward.quantity > 1 && (
              <p className="text-lg font-semibold text-primary">
                x{userReward.quantity}
              </p>
            )}
          </div>

          {/* Estado del premio */}
          {userReward.rewardStatus === "pending" && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Este premio requiere reclamación manual.
                <br />
                Revisa tu inventario de premios.
              </p>
            </div>
          )}
        </div>

        <Button onClick={handleClose} className="w-full" size="lg">
          ¡Genial!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
