import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border border-transparent shadow-sm hover:shadow-md hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-sm transition-all duration-200 after:absolute after:inset-0 after:content-[''] after:bg-gradient-to-t after:from-black/5 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
        destructive:
          "bg-background text-destructive border border-destructive shadow-sm hover:shadow-md hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-sm transition-all duration-200 hover:bg-destructive/10 after:absolute after:inset-0 after:content-[''] after:bg-gradient-to-t after:from-destructive/5 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
        outline:
          "border border-input bg-background shadow-sm hover:shadow-md hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-sm transition-all duration-200 hover:bg-accent/50 hover:border-accent after:absolute after:inset-0 after:content-[''] after:bg-gradient-to-t after:from-black/5 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
        secondary:
          "bg-secondary text-secondary-foreground border border-transparent shadow-sm hover:shadow-md hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-sm transition-all duration-200 hover:bg-secondary/80 after:absolute after:inset-0 after:content-[''] after:bg-gradient-to-t after:from-black/5 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
        ghost: "hover:bg-accent/50 transition-all duration-200 hover:translate-y-[-1px] active:translate-y-[1px]",
        link: "text-primary underline-offset-4 hover:underline transition-all duration-200 hover:translate-y-[-1px] active:translate-y-[1px]",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-9 w-9 rounded-full p-0",
        xs: "h-7 rounded-md px-2 text-xs",
        xl: "h-12 rounded-md px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
