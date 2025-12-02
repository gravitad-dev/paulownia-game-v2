"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, type LucideIcon } from "lucide-react";

export type ConfirmDialogVariant = "warning" | "danger" | "info";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

const variantConfig: Record<
  ConfirmDialogVariant,
  {
    icon: LucideIcon;
    iconColor: string;
    buttonVariant:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
  }
> = {
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    buttonVariant: "default",
  },
  danger: {
    icon: AlertTriangle,
    iconColor: "text-red-500",
    buttonVariant: "destructive",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    buttonVariant: "default",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                variant === "danger"
                  ? "bg-red-100"
                  : variant === "warning"
                  ? "bg-yellow-100"
                  : "bg-blue-100"
              }`}
            >
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para usar ConfirmDialog de forma imperativa
 */
export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmDialogVariant;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const confirm = React.useCallback(
    (options: {
      title: string;
      description: string;
      confirmText?: string;
      cancelText?: string;
      variant?: ConfirmDialogVariant;
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          ...options,
          onConfirm: () => {
            setState((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setState((prev) => ({ ...prev, isOpen: false }));
            resolve(false);
          },
        });
      });
    },
    [],
  );

  const handleClose = React.useCallback(() => {
    state.onCancel?.();
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state]);

  const ConfirmDialogComponent = React.useCallback(
    () => (
      <ConfirmDialog
        isOpen={state.isOpen}
        onClose={handleClose}
        onConfirm={state.onConfirm}
        title={state.title}
        description={state.description}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        variant={state.variant}
      />
    ),
    [state, handleClose],
  );

  return { confirm, ConfirmDialogComponent };
}
