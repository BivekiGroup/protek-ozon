"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(1);

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = idRef.current++;
    const next: Toast = { id, ...t };
    setToasts((prev) => [...prev, next]);
    // auto dismiss in 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster toasts={toasts} onClose={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
    </ToastContext.Provider>
  );
}

export function Toaster({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-md border px-3 py-2 shadow-sm bg-white text-slate-900",
            t.variant === "destructive" ? "border-red-600" : "border-slate-200"
          )}
        >
          {t.title ? (
            <div className={cn("text-sm font-medium", t.variant === "destructive" ? "text-red-700" : "text-slate-900")}>{t.title}</div>
          ) : null}
          {t.description ? (
            <div className="text-xs text-slate-600 mt-0.5">{t.description}</div>
          ) : null}
          <button
            className="absolute top-1 right-1 text-xs text-slate-400 hover:text-slate-600"
            onClick={() => onClose(t.id)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

