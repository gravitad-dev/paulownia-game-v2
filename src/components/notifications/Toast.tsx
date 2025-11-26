"use client";

import { X, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";
import { Toast } from "@/types/notification";
import { cn } from "@/lib/utils";

const typeStyles = {
  success: {
    border: "border-l-4 border-l-emerald-500",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
    accent: "bg-emerald-50",
  },
  error: {
    border: "border-l-4 border-l-rose-500",
    icon: XCircle,
    iconColor: "text-rose-600",
    accent: "bg-rose-50",
  },
  info: {
    border: "border-l-4 border-l-sky-500",
    icon: Info,
    iconColor: "text-sky-600",
    accent: "bg-sky-50",
  },
  warning: {
    border: "border-l-4 border-l-amber-500",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    accent: "bg-amber-50",
  },
} as const;

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastItem({ toast, onClose }: ToastProps) {
  const style = typeStyles[toast.type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "relative w-full max-w-md rounded-xl bg-white shadow-xl ring-1 ring-black/5 px-5 py-4 transition-all duration-300",
        "data-[state=entering]:translate-y-0 data-[state=entering]:opacity-100 data-[state=exiting]:-translate-y-2 data-[state=exiting]:opacity-0",
        style.border
      )}
      data-state="entering"
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-10 w-10 items-center justify-center rounded-full",
            style.accent
          )}
        >
          <Icon className={cn("h-5 w-5", style.iconColor)} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
          {toast.description && (
            <p className="text-sm text-gray-600 mt-1">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}



