import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative group">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-primary/50 shadow-sm focus-visible:shadow-md",
            "after:absolute after:inset-0 after:content-[''] after:bg-gradient-to-t after:from-white/5 after:to-transparent after:opacity-0 focus:after:opacity-100 after:transition-opacity after:duration-300",
            "translate-y-0 focus-visible:translate-y-[-1px]",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/[0.01] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
