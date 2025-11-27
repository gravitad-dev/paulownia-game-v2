"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Gift, ShoppingBag, Sparkles } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Premios</CardTitle>
              <CardDescription>
                Canjea tus monedas y tickets por premios exclusivos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Tienda de premios próximamente</p>
            <p className="text-sm mt-1">
              Podrás canjear tus monedas y tickets por increíbles recompensas
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Premios Especiales</CardTitle>
              <CardDescription>
                Recompensas exclusivas por tiempo limitado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Próximamente</p>
            <p className="text-sm mt-1">
              Premios especiales y ofertas por tiempo limitado
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
