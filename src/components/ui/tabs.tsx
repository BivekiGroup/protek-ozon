"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export function Tabs({ defaultValue, value, onValueChange, children, className }: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isControlled = value !== undefined && onValueChange !== undefined;
  const [internal, setInternal] = React.useState(defaultValue || "");
  const current = isControlled ? value! : internal;
  const setValue = (v: string) => (isControlled ? onValueChange!(v) : setInternal(v));
  React.useEffect(() => {
    if (!isControlled && !internal && React.Children.count(children) > 0 && typeof defaultValue === "string") {
      setInternal(defaultValue);
    }
  }, [children, defaultValue, internal, isControlled]);
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within <Tabs>");
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md border",
        active ? "bg-black text-white border-black" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within <Tabs>");
  if (ctx.value !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}

