import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
type Size = "default" | "sm" | "lg" | "icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  default: "bg-black text-white hover:bg-black/90",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80 border",
  destructive: "bg-red-600 text-white hover:bg-red-600/90",
  outline: "border bg-transparent hover:bg-slate-50",
  ghost: "hover:bg-slate-50 hover:text-slate-900",
  link: "text-blue-600 underline-offset-4 hover:underline bg-transparent",
}

const sizeClasses: Record<Size, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
