import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "default" | "secondary" | "destructive" | "outline"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  default: "border-transparent bg-slate-900 text-slate-50",
  secondary: "border-transparent bg-slate-100 text-slate-900",
  destructive: "border-transparent bg-red-600 text-white",
  outline: "text-slate-950 border",
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
