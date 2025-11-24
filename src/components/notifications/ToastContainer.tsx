"use client";

import { useNotificationStore } from "@/store/useNotificationStore";
import { ToastItem } from "./Toast";

export function ToastContainer() {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-100 flex flex-col-reverse items-center gap-3 px-4">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-md">
          <ToastItem
            toast={toast}
            onClose={(id) => {
              removeToast(id);
            }}
          />
        </div>
      ))}
    </div>
  );
}
