"use client";

import { useCallback } from "react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { ToastType } from "@/types/notification";

type ToastFn = (title: string, description?: string) => void;

export function useToast() {
  const addToast = useNotificationStore((state) => state.addToast);

  const trigger = useCallback(
    (type: ToastType, title: string, description?: string) => {
      addToast({ type, title, description });
    },
    [addToast]
  );

  const success: ToastFn = (title, description) =>
    trigger("success", title, description);
  const error: ToastFn = (title, description) =>
    trigger("error", title, description);
  const info: ToastFn = (title, description) =>
    trigger("info", title, description);
  const warning: ToastFn = (title, description) =>
    trigger("warning", title, description);

  return {
    success,
    error,
    info,
    warning,
  };
}












