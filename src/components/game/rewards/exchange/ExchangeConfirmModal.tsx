"use client";

import {
  Coins,
  Ticket,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExchangeConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketsRequested: number;
  coinsRequired: number;
  maxTickets: number;
  userCoins: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Modal de confirmación antes de realizar el canje
 */
export function ExchangeConfirmModal({
  open,
  onOpenChange,
  ticketsRequested,
  coinsRequired,
  maxTickets,
  userCoins,
  onConfirm,
  isLoading = false,
}: ExchangeConfirmModalProps) {
  // Validar que los valores sean consistentes
  const isValid =
    ticketsRequested > 0 &&
    ticketsRequested <= maxTickets &&
    coinsRequired <= userCoins &&
    Number.isInteger(ticketsRequested);

  const handleConfirm = () => {
    // Doble validación antes de confirmar
    if (!isValid) {
      onOpenChange(false);
      return;
    }
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">Confirmar Canje</DialogTitle>
          <DialogDescription>
            Revisa los detalles antes de completar la transacción
          </DialogDescription>
        </DialogHeader>

        {/* Visualización del canje */}
        <div className="flex flex-col items-center gap-6 py-4">
          {!isValid && (
            <div className="flex items-center gap-2 p-3 w-full bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Los valores no son válidos. Por favor, cierra y vuelve a
                intentar.
              </span>
            </div>
          )}
          <div className="relative flex items-center justify-between w-full p-6 bg-linear-to-r from-amber-50/50 to-blue-50/50 dark:from-amber-950/20 dark:to-blue-950/20 rounded-xl border border-border/50">
            {/* Coins Side */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full ring-4 ring-amber-50 dark:ring-amber-900/10 shadow-sm">
                <Coins className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                  {coinsRequired.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest">
                  Monedas
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="p-1.5 rounded-full bg-muted/50">
                <ArrowRight className="h-5 w-5 text-muted-foreground/70" />
              </div>
            </div>

            {/* Tickets Side */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full ring-4 ring-blue-50 dark:ring-blue-900/10 shadow-sm">
                <Ticket className="h-6 w-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                  {ticketsRequested}
                </span>
                <span className="text-[10px] font-bold text-blue-600/70 dark:text-blue-500/70 uppercase tracking-widest">
                  {ticketsRequested === 1 ? "Ticket" : "Tickets"}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground px-4">
            Se descontarán{" "}
            <strong className="text-foreground">
              {coinsRequired.toLocaleString()} monedas
            </strong>{" "}
            de tu saldo actual.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !isValid}
            className="flex-1 shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4 mr-2" />
                Confirmar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
