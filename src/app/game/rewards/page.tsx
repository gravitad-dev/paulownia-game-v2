"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  Ticket,
  Loader2,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";
import { useExchangeStore } from "@/store/useExchangeStore";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import {
  TicketSelector,
  ExchangeLimitInfo,
  ExchangeHistory,
  ExchangeConfirmModal,
} from "@/components/game/rewards/exchange";

export default function ExchangePage() {
  const playerStats = usePlayerStatsStore((state) => state.stats);
  const {
    canExchange,
    maxTicketsPossible,
    rate,
    limit,
    history,
    isLoading,
    isExchanging,
    fetchStatus,
    exchangeCoins,
    reset,
  } = useExchangeStore();

  const toast = useToast();
  const [ticketsRequested, setTicketsRequested] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Handler seguro para cambios de tickets (valida límites)
  const handleTicketsChange = (value: number) => {
    // Asegurar que sea un número válido
    const numValue = Math.floor(Number(value));
    if (isNaN(numValue) || numValue < 1) {
      setTicketsRequested(1);
      return;
    }
    // Limitar al máximo permitido
    const safeValue = Math.min(numValue, maxTicketsPossible);
    setTicketsRequested(safeValue);
  };

  // Fetch inicial del estado y limpieza al salir
  useEffect(() => {
    fetchStatus();
    return () => reset();
  }, [fetchStatus, reset]);

  // Ajustar ticketsRequested si maxTicketsPossible cambia
  useEffect(() => {
    if (ticketsRequested > maxTicketsPossible && maxTicketsPossible > 0) {
      setTicketsRequested(maxTicketsPossible);
    } else if (maxTicketsPossible > 0 && ticketsRequested === 0) {
      setTicketsRequested(1);
    }
  }, [maxTicketsPossible, ticketsRequested]);

  const handleExchange = async () => {
    const success = await exchangeCoins(ticketsRequested);

    if (success) {
      const state = useExchangeStore.getState();
      const exchangeData = state.lastExchange;

      if (exchangeData) {
        toast.success(
          "¡Canje exitoso!",
          `Has obtenido ${exchangeData.ticketsExchanged} ticket${
            exchangeData.ticketsExchanged > 1 ? "s" : ""
          } por ${exchangeData.coinsSpent.toLocaleString()} monedas`,
        );
      }

      setShowConfirmModal(false);
      // Reset al mínimo si es posible
      if (state.maxTicketsPossible > 0) {
        setTicketsRequested(1);
      }
    } else {
      const errorMsg = useExchangeStore.getState().error;
      toast.error(
        "Error en el canje",
        errorMsg || "Ha ocurrido un error inesperado",
      );
    }
  };

  const handleLimitReset = () => {
    // Refrescar estado cuando el límite se reinicie
    fetchStatus();
  };

  const coinsRequired = ticketsRequested * rate;

  // Estado de carga inicial
  if (isLoading && !rate) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          Cargando información del canje...
        </p>
      </div>
    );
  }

  // Sin tasa configurada (error de configuración)
  if (!rate) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground text-center">
          El canje de monedas no está disponible en este momento.
          <br />
          Por favor, inténtalo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 max-w-6xl">
      {/* Header de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-linear-to-br from-amber-50/50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-100 dark:border-amber-800/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-full">
              <Coins className="h-6 w-6 text-amber-500/80 dark:text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tus Monedas
              </p>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {playerStats?.coins.toLocaleString() || 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-100 dark:border-blue-800/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-full">
              <Ticket className="h-6 w-6 text-blue-500/80 dark:text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tus Tickets
              </p>
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {playerStats?.tickets || 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-full">
              <ArrowRightLeft className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tasa de Cambio
              </p>
              <h3 className="text-xl font-bold text-foreground/80">
                {rate}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  monedas / ticket
                </span>
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Columna Principal: Selector y Acción */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="h-full border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Canjear Monedas</CardTitle>
              <CardDescription className="text-sm">
                Selecciona la cantidad de tickets que deseas obtener
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-5">
              {canExchange && maxTicketsPossible > 0 ? (
                <>
                  <TicketSelector
                    value={ticketsRequested}
                    onChange={handleTicketsChange}
                    max={maxTicketsPossible}
                    rate={rate}
                    disabled={isExchanging}
                  />

                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Costo por ticket:
                      </span>
                      <span className="font-medium">{rate} monedas</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cantidad:</span>
                      <span className="font-medium">
                        {ticketsRequested} tickets
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total a pagar:</span>
                      <span className="text-primary">
                        {coinsRequired.toLocaleString()} monedas
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-10 text-sm shadow-md hover:shadow-lg transition-all"
                    size="lg"
                    onClick={() => {
                      // Validación final antes de abrir el modal
                      if (
                        !canExchange ||
                        ticketsRequested <= 0 ||
                        ticketsRequested > maxTicketsPossible
                      ) {
                        toast.error(
                          "Error",
                          "Los valores seleccionados no son válidos",
                        );
                        return;
                      }
                      setShowConfirmModal(true);
                    }}
                    disabled={
                      isExchanging ||
                      ticketsRequested <= 0 ||
                      ticketsRequested > maxTicketsPossible
                    }
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    Confirmar Canje
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <div className="p-3 bg-muted rounded-full">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base">
                      No es posible realizar el canje
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      {limit && limit.ticketsRemaining === 0
                        ? "Has alcanzado el límite de canjes para este período. Vuelve cuando el contador se reinicie."
                        : "No tienes suficientes monedas para canjear por tickets en este momento."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Secundaria: Límites e Historial */}
        <div className="lg:col-span-5 space-y-4">
          {/* Info del límite */}
          {limit && (
            <ExchangeLimitInfo limit={limit} onLimitReset={handleLimitReset} />
          )}

          {/* Historial */}
          <ExchangeHistory history={history} />
        </div>
      </div>

      {/* Modal de confirmación */}
      <ExchangeConfirmModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        ticketsRequested={ticketsRequested}
        coinsRequired={coinsRequired}
        maxTickets={maxTicketsPossible}
        userCoins={playerStats?.coins || 0}
        onConfirm={handleExchange}
        isLoading={isExchanging}
      />
    </div>
  );
}
