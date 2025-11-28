"use client";

import Image from "next/image";
import { Coins, Ticket, Package, Sparkles, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getStrapiImageUrl } from "@/lib/image-utils";
import { FALLBACK_IMAGES } from "@/constants";
import type { CatalogReward } from "@/types/reward";

interface CatalogCardProps {
  reward: CatalogReward;
  className?: string;
}

export function CatalogCard({ reward, className }: CatalogCardProps) {
  const imageUrl =
    getStrapiImageUrl(reward.image?.url) || FALLBACK_IMAGES.rewardSmall;

  const getTypeIcon = () => {
    switch (reward.typeReward) {
      case "currency":
        return reward.name.toLowerCase().includes("ticket") ? (
          <Ticket className="h-4 w-4" />
        ) : (
          <Coins className="h-4 w-4" />
        );
      case "consumable":
        return <Package className="h-4 w-4" />;
      case "cosmetic":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (reward.typeReward) {
      case "currency":
        return reward.name.toLowerCase().includes("ticket")
          ? "Tickets"
          : "Monedas";
      case "consumable":
        return "Consumible";
      case "cosmetic":
        return "Cosmético";
      default:
        return "Premio";
    }
  };

  const getTypeColor = () => {
    switch (reward.typeReward) {
      case "currency":
        return reward.name.toLowerCase().includes("ticket")
          ? "text-blue-500 bg-blue-500/10"
          : "text-amber-500 bg-amber-500/10";
      case "consumable":
        return "text-green-500 bg-green-500/10";
      case "cosmetic":
        return "text-purple-500 bg-purple-500/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-lg transition-shadow h-full",
        className,
      )}
    >
      {/* Imagen */}
      <div className="relative h-32 sm:h-38 bg-muted">
        <Image
          src={imageUrl}
          alt={reward.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Badge de tipo */}
        <div
          className={cn(
            "absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            getTypeColor(),
          )}
        >
          {getTypeIcon()}
          {getTypeLabel()}
        </div>
      </div>

      {/* Contenido */}
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-1">{reward.name}</h3>
        {reward.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {reward.description}
          </p>
        )}
        {/* Valor del premio */}
        {reward.value > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              +{reward.value.toLocaleString()}
            </span>
            <span>
              {reward.typeReward === "currency"
                ? reward.name.toLowerCase().includes("ticket")
                  ? "tickets"
                  : "monedas"
                : "valor"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
